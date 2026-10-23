const ServiceRequest = require("../models/serviceRequest");
const ServiceLaborRate = require("../models/serviceLaborRate");
const Mechanic = require("../models/mechanic");
const BusinessRecord = require("../models/businessRecord");
const User = require("../models/user");
const Notification = require("../models/notification");
const mongoose = require("mongoose");
const ReservationSettings = require("../models/reservationSettings");
const {
  validateReceipt,
  validateReference,
  uploadReceipt,
  claimPaymentReference,
  getAuthorizedReceiptUrl,
  removeReceipt
} = require("../utils/paymentReceipt");
const { createPaymentDecisionNotification } = require("../utils/paymentNotifications");
const { releaseServiceSlot } = require("../utils/serviceSlotCapacity");

const offeredServiceTypes = [
  "Foam Seat Repair",
  "Flat/Semi Seat Customization",
  "Indo Seat Customization",
  "Engine Tune-up",
  "Oil Change",
  "Brake Adjustment",
  "Chain & Sprocket Service",
  "Suspension Check",
  "Electrical Diagnostics",
  "Full Motorcycle Inspection",
];

// Mechanic accepts a pending job, sets start time, and confirms
const mechanicAcceptJob = async (req, res) => {
  try {
    const { requestId, startTime } = req.body;
    const mechanicId = req.user.userId;

    if (!requestId) {
      return res
        .status(400)
        .json({ message: "Request ID is required" });
    }

    const serviceRequest =
      await ServiceRequest.findById(requestId).populate("user");
    if (!serviceRequest)
      return res.status(404).json({ message: "Service request not found" });
    if (serviceRequest.status === "pending" && !serviceRequest.mechanic) {
      const assignedRequest = await ServiceRequest.findOneAndUpdate(
        { _id: requestId, status: "pending", mechanic: null },
        {
          $set: {
            mechanic: mechanicId,
            mechanicId,
            status: "assigned",
            updatedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: "assigned",
              timestamp: new Date(),
              note: "Accepted by mechanic",
            },
          },
        },
        { new: true, runValidators: true },
      ).populate("user");
      if (!assignedRequest)
        return res.status(409).json({ message: "This request has already been assigned." });
      return res.status(200).json({
        message: "Service request accepted.",
        serviceRequest: assignedRequest,
      });
    }

    if (serviceRequest.mechanic?.toString() !== mechanicId || serviceRequest.status !== "confirmed") {
      return res
        .status(400)
        .json({ message: "Job is not available for acceptance." });
    }
    if (startTime) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        return res.status(400).json({ message: "Start time must use 24-hour HH:mm format." });
      }
      const [h, m] = startTime.split(":").map(Number);
      if (h < 8 || h > 17 || m < 0 || m > 59 || (h === 17 && m > 0)) {
        return res.status(400).json({ message: "Start time must be between 08:00 and 17:00." });
      }
    }

    serviceRequest.status = "accepted";
    if (!serviceRequest.startTime && startTime) serviceRequest.startTime = startTime;
    await serviceRequest.save();

    // Notification stubs (replace with real notification logic)
    console.log(
      `NOTIFY ADMIN: Mechanic ${mechanicId} accepted job ${requestId} for user ${serviceRequest.user._id}`,
    );
    console.log(
      `NOTIFY USER: Your service request is accepted by mechanic ${mechanicId} and will start at ${startTime}`,
    );

    res.status(200).json({
      message: "Job accepted and start time set",
      serviceRequest,
    });
  } catch (error) {
    console.error("[mechanicAcceptJob] error", error);
    res
      .status(500)
      .json({ message: "Failed to accept job. Please try again." });
  }
};

const syncCompletedServiceBusinessRecord = async (serviceRequest, session = null) => {
  if (!serviceRequest || serviceRequest.status !== "completed") return null;

  const userQuery = User.findById(serviceRequest.user);
  const mechanicQuery = Mechanic.findById(
    serviceRequest.mechanicId || serviceRequest.mechanic,
  );
  const existingRecordQuery = BusinessRecord.findOne({
    recordType: "service",
    sourceId: serviceRequest._id,
  }).select("completedAt");
  if (session) {
    userQuery.session(session);
    mechanicQuery.session(session);
    existingRecordQuery.session(session);
  }
  const [user, mechanic, existingRecord] = await Promise.all([
    userQuery.lean(),
    mechanicQuery.lean(),
    existingRecordQuery.lean()
  ]);

  const customerName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "Customer"
    : "Customer";
  const businessRecordData = {
    recordType: "service",
    sourceId: serviceRequest._id,
    customer: customerName,
    customerPhone: user?.phoneNumber || "",
    itemName: serviceRequest.serviceType,
    category: "Service Booking",
    mechanicId: serviceRequest.mechanicId || serviceRequest.mechanic || null,
    mechanicName: mechanic
      ? `${mechanic.firstName || ""} ${mechanic.lastName || ""}`.trim()
      : "",
    amount: Number(serviceRequest.estimatedPrice) || 0,
    laborFee: Number(serviceRequest.laborFee ?? 50),
    status: serviceRequest.status,
    completedAt:
      serviceRequest.completedAt ||
      existingRecord?.completedAt ||
      new Date(serviceRequest.updatedAt || Date.now()),
    notes: serviceRequest.description || "Completed service request",
  };

  return BusinessRecord.findOneAndUpdate(
    { recordType: "service", sourceId: serviceRequest._id },
    businessRecordData,
    { upsert: true, new: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) },
  );
};

const serviceStatusTransitions = {
  confirmed: ["accepted", "declined"],
  assigned: ["in-progress", "declined"],
  accepted: ["in-progress"],
  "in-progress": ["completed"]
};

const transitionServiceRequestStatus = async ({ requestId, mechanicId, status, startTime }) => {
  if (!mongoose.Types.ObjectId.isValid(requestId) || !mongoose.Types.ObjectId.isValid(mechanicId)) {
    throw Object.assign(new Error("Service request and mechanic IDs are required."), { status: 400 });
  }
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const request = await ServiceRequest.findById(requestId).session(session);
      if (!request) throw Object.assign(new Error("Service request not found"), { status: 404 });
      if (String(request.mechanic || request.mechanicId) !== String(mechanicId)) {
        throw Object.assign(new Error("You can only update your assigned jobs"), { status: 403 });
      }
      if (!serviceStatusTransitions[request.status]?.includes(status)) {
        throw Object.assign(new Error(`Cannot change status from ${request.status} to ${status}`), { status: 400 });
      }
      if (startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        throw Object.assign(new Error("Start time must use 24-hour HH:mm format."), { status: 400 });
      }

      const now = new Date();
      result = await ServiceRequest.findOneAndUpdate(
        {
          _id: request._id,
          status: request.status,
          $or: [{ mechanic: mechanicId }, { mechanicId }]
        },
        {
          $set: {
            status,
            updatedAt: now,
            ...(startTime && !request.startTime ? { startTime } : {}),
            ...(status === "completed" ? { completedAt: now, mechanicId } : {})
          },
          $push: {
            statusHistory: {
              status,
              timestamp: now,
              note: `Status updated to ${status}`
            }
          }
        },
        { new: true, runValidators: true, session }
      );
      if (!result) {
        throw Object.assign(new Error("This job changed before the update could be saved."), { status: 409 });
      }
      if (status === "completed") {
        await syncCompletedServiceBusinessRecord(result, session);
      }
    });
  } finally {
    await session.endSession();
  }
  return result;
};

const getServiceLaborRates = async (req, res) => {
  try {
    await ServiceLaborRate.bulkWrite(
      offeredServiceTypes.map((serviceType) => ({
        updateOne: {
          filter: { serviceType },
          update: { $setOnInsert: { serviceType, laborFee: 50 } },
          upsert: true,
        },
      })),
    );

    const rates = await ServiceLaborRate.find({ isActive: { $ne: false } }).sort({ serviceType: 1 });
    res.status(200).json({ rates });
  } catch (error) {
    console.error("[getServiceLaborRates] error", error);
    res.status(500).json({ message: "Failed to load service labor rates" });
  }
};

const updateServiceLaborRate = async (req, res) => {
  try {
    if (
      req.body.laborFee === "" ||
      req.body.laborFee === null ||
      req.body.laborFee === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Labor fee must be a non-negative number" });
    }
    const laborFee = Number(req.body.laborFee);
    if (!Number.isFinite(laborFee) || laborFee < 0) {
      return res
        .status(400)
        .json({ message: "Labor fee must be a non-negative number" });
    }

    const rate = await ServiceLaborRate.findByIdAndUpdate(
      req.params.id,
      { laborFee },
      { new: true, runValidators: true },
    );
    if (!rate)
      return res.status(404).json({ message: "Service labor rate not found" });

    res.status(200).json({ rate });
  } catch (error) {
    console.error("[updateServiceLaborRate] error", error);
    res.status(500).json({ message: "Failed to update service labor rate" });
  }
};

const updateServiceRequestLaborFee = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (
      req.body.laborFee === "" ||
      req.body.laborFee === null ||
      req.body.laborFee === undefined
    ) {
      return res.status(400).json({
        message: "Request ID and a non-negative labor fee are required",
      });
    }
    const laborFee = Number(req.body.laborFee);
    if (!requestId || !Number.isFinite(laborFee) || laborFee < 0) {
      return res.status(400).json({
        message: "Request ID and a non-negative labor fee are required",
      });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    serviceRequest.laborFee = laborFee;
    await serviceRequest.save();
    await syncCompletedServiceBusinessRecord(serviceRequest);

    res.status(200).json({ serviceRequest });
  } catch (error) {
    console.error("[updateServiceRequestLaborFee] error", error);
    res.status(500).json({ message: "Failed to update service labor fee" });
  }
};

const customerServiceRequestPayload = (request) => {
  const value = request.toObject ? request.toObject() : { ...request };
  delete value.paymentProofPublicId;
  delete value.paymentProofUrl;
  delete value.paymentSubmissions;
  return value;
};

const submitServicePayment = async (req, res) => {
  let uploadedReceipt;
  let session;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Service booking not found." });
    }
    const reference = validateReference(req.body?.reference);
    validateReceipt(req.file);
    const [settings, customer] = await Promise.all([
      ReservationSettings.getDefaults(),
      User.findById(req.user.userId)
    ]);
    if (!customer) return res.status(404).json({ message: "Customer account not found." });
    if (!settings.paymentInstructions.methodName || !settings.paymentInstructions.accountName || !settings.paymentInstructions.accountNumber) {
      return res.status(409).json({ message: "The shop payment instructions are not configured yet. Please contact the shop before submitting payment." });
    }
    const request = await ServiceRequest.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.userId }, { customerId: req.user.userId }]
    });
    if (!request) return res.status(404).json({ message: "Service booking not found." });
    if ((request.paymentStatus || "Payment Pending") !== "Payment Pending") {
      return res.status(409).json({ message: "Payment can only be submitted for a booking awaiting payment." });
    }

    uploadedReceipt = await uploadReceipt(req.file);
    session = await mongoose.startSession();
    let updatedRequest;
    await session.withTransaction(async () => {
      const current = await ServiceRequest.findOne({
        _id: req.params.id,
        $or: [{ user: req.user.userId }, { customerId: req.user.userId }],
        paymentStatus: { $in: ["Payment Pending", null] }
      }).session(session);
      if (!current) throw Object.assign(new Error("Payment can only be submitted for a booking awaiting payment."), { status: 409 });
      const submittedAt = new Date();
      await claimPaymentReference({ reference, recordType: "service", recordId: current._id, session });
      current.code = current.code || `SRV-${String(current._id).slice(-6).toUpperCase()}`;
      current.paymentStatus = "Payment Submitted";
      current.paymentMethod = settings.paymentInstructions.methodName;
      current.paymentReference = reference;
      current.paymentProofPublicId = uploadedReceipt.publicId;
      current.paymentSubmittedAt = submittedAt;
      current.paymentRejectionReason = "";
      current.paymentSubmissions.push({
        reference,
        paymentProofPublicId: uploadedReceipt.publicId,
        submittedAt,
        status: "Payment Submitted"
      });
      updatedRequest = await current.save({ session });
      const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email || "Customer";
      await Notification.create([{
        audience: "admin",
        type: "payment_submitted",
        message: `New payment submitted: ${current.code} · ${customerName} · ₱${Number(current.estimatedPrice || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        recordId: current._id,
        recordType: "service"
      }], { session });
    });
    res.json({ success: true, serviceRequest: customerServiceRequestPayload(updatedRequest) });
  } catch (error) {
    if (uploadedReceipt?.publicId) {
      try {
        await removeReceipt(uploadedReceipt.publicId);
      } catch (cleanupError) {
        console.error("[submitServicePayment] receipt cleanup failed", cleanupError);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "This reference number was already used." });
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("[submitServicePayment] error", error);
    res.status(500).json({ message: "Payment could not be submitted. Please try again." });
  } finally {
    if (session) await session.endSession();
  }
};

const reviewServicePayment = async (req, res) => {
  let session;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Service booking not found." });
    }
    const confirmed = req.method === "POST" && req.path.endsWith("/confirm-payment");
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!confirmed && (reason.length < 3 || reason.length > 300)) {
      return res.status(400).json({ message: "Provide a rejection reason between 3 and 300 characters." });
    }
    session = await mongoose.startSession();
    let serviceRequest;
    await session.withTransaction(async () => {
      serviceRequest = await ServiceRequest.findById(req.params.id).session(session);
      if (!serviceRequest) throw Object.assign(new Error("Service booking not found."), { status: 404 });
      if (serviceRequest.paymentStatus !== "Payment Submitted") {
        throw Object.assign(new Error("Only submitted payments can be reviewed."), { status: 409 });
      }
      const reviewedAt = new Date();
      const latestSubmission = serviceRequest.paymentSubmissions[serviceRequest.paymentSubmissions.length - 1];
      if (confirmed) {
        serviceRequest.paymentStatus = "Confirmed";
        serviceRequest.paymentConfirmedAt = reviewedAt;
        serviceRequest.paymentConfirmedBy = req.admin.id;
        if (latestSubmission) latestSubmission.status = "Confirmed";
      } else {
        serviceRequest.paymentStatus = "Payment Pending";
        serviceRequest.paymentRejectedAt = reviewedAt;
        serviceRequest.paymentRejectedBy = req.admin.id;
        serviceRequest.paymentRejectionReason = reason;
        if (latestSubmission) {
          latestSubmission.status = "Rejected";
          latestSubmission.rejectionReason = reason;
        }
      }
      if (latestSubmission) {
        latestSubmission.reviewedAt = reviewedAt;
        latestSubmission.reviewedBy = req.admin.id;
      }
      serviceRequest = await serviceRequest.save({ session });
      await createPaymentDecisionNotification({
        customerId: serviceRequest.customerId || serviceRequest.user,
        recordId: serviceRequest._id,
        recordType: "service",
        code: serviceRequest.code || `SRV-${String(serviceRequest._id).slice(-6).toUpperCase()}`,
        confirmed,
        reason,
        session
      });
    });
    res.json({ success: true, serviceRequest });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("[reviewServicePayment] error", error);
    res.status(500).json({ message: "Service payment could not be updated." });
  } finally {
    if (session) await session.endSession();
  }
};

// Admin assigns a mechanic to a job
const assignMechanic = async (req, res) => {
  try {
    const { requestId, mechanicId } = req.body;
    const mechanic = await Mechanic.findOne({
      _id: mechanicId,
      isActive: true,
    });
    if (!mechanic)
      return res.status(400).json({ message: "Mechanic is not available" });
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest)
      return res.status(404).json({ message: "Service request not found" });

    if (["completed", "declined", "cancelled"].includes(serviceRequest.status)) {
      return res.status(400).json({ message: "This service request can no longer be assigned." });
    }
    serviceRequest.mechanic = mechanicId;
    serviceRequest.mechanicId = mechanicId;
    serviceRequest.status = "assigned";
    await serviceRequest.save();

    res.status(200).json({
      message: "Mechanic assigned",
      serviceRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all service requests (admin)
const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate("user")
      .populate("mechanic");
    res.status(200).json({ requests: requests.map((request) => {
      const value = request.toObject();
      value.paymentProofUrl = getAuthorizedReceiptUrl(value.paymentProofPublicId);
      value.paymentSubmissions = (value.paymentSubmissions || []).map((submission) => ({
        ...submission.toObject(),
        receiptUrl: getAuthorizedReceiptUrl(submission.paymentProofPublicId)
      }));
      delete value.paymentProofPublicId;
      return value;
    }) });
  } catch (error) {
    console.error("[getAllServiceRequests] error", error);
    res
      .status(500)
      .json({ message: "Failed to load service requests. Please try again." });
  }
};

// Mechanic updates job status
const updateJobStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const validStatuses = Object.values(serviceStatusTransitions).flat();
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const serviceRequest = await transitionServiceRequestStatus({
      requestId,
      mechanicId: req.user.userId,
      status
    });
    if (status === "declined") await releaseServiceSlot(serviceRequest);

    res.status(200).json({
      message: "Job status updated",
      serviceRequest,
    });
  } catch (error) {
    console.error("[updateJobStatus] error", error);
    if (error.status) return res.status(error.status).json({ message: error.message });
    res
      .status(500)
      .json({ message: "Failed to update job status. Please try again." });
  }
};

// Admin updates the booking status while monitoring the schedule.
const updateBookingStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const validStatuses = [
      "pending",
      "assigned",
      "confirmed",
      "accepted",
      "in-progress",
      "completed",
      "declined",
      "cancelled",
    ];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid booking status" });

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest)
      return res.status(404).json({ message: "Service request not found" });

    if (status === "assigned" && !serviceRequest.mechanic) {
      return res.status(400).json({ message: "Assign a mechanic before setting this request to Assigned." });
    }
    serviceRequest.status = status;
    await serviceRequest.save();
    if (status === "declined" || status === "cancelled") await releaseServiceSlot(serviceRequest);
    await syncCompletedServiceBusinessRecord(serviceRequest);
    res.status(200).json({ message: "Booking status updated", serviceRequest });
  } catch (error) {
    console.error("[updateBookingStatus] error", error);
    res
      .status(500)
      .json({ message: "Failed to update booking status. Please try again." });
  }
};

// User gets their own service requests
const getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await ServiceRequest.find({ $or: [{ user: userId }, { customerId: userId }] }).populate(
      "mechanic",
    );
    res.status(200).json({ requests: requests.map(customerServiceRequestPayload) });
  } catch (error) {
    console.error("[getUserServiceRequests] error", error);
    res.status(500).json({
      message: "Failed to load your service requests. Please try again.",
    });
  }
};

// Mechanic gets their assigned jobs
const getMechanicJobs = async (req, res) => {
  try {
    const mechanicId = req.user.userId;
    const jobs = await ServiceRequest.find({
      $or: [
        { mechanic: mechanicId },
        { mechanic: null, status: "pending" },
      ],
    })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });
    const formattedJobs = jobs.map((job) => {
      const request = job.toObject();
      request.customerName =
        `${request.user?.firstName || ""} ${request.user?.lastName || ""}`.trim() ||
        request.user?.email ||
        "Customer";
      return request;
    });
    res.status(200).json({ jobs: formattedJobs });
  } catch (error) {
    console.error("[getMechanicJobs] error", error);
    res
      .status(500)
      .json({ message: "Failed to load your jobs. Please try again." });
  }
};

module.exports = {
  submitServicePayment,
  reviewServicePayment,
  assignMechanic,
  getAllServiceRequests,
  updateJobStatus,
  getUserServiceRequests,
  getMechanicJobs,
  mechanicAcceptJob,
  updateBookingStatus,
  getServiceLaborRates,
  updateServiceLaborRate,
  updateServiceRequestLaborFee,
  syncCompletedServiceBusinessRecord,
  transitionServiceRequestStatus,
};
