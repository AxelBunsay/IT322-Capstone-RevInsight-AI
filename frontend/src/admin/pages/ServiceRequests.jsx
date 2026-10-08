import { useEffect, useState } from "react";
import { adminApi as api } from "../services/adminApi";
import { AdminPageFrame } from "./ManagementPageComponents";

function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [savingFeeId, setSavingFeeId] = useState("");
  const [laborFeeDrafts, setLaborFeeDrafts] = useState({});

  const loadRequests = () =>
    Promise.all([api.getAdminServiceRequests(), api.getMechanics()]).then(
      ([requestResponse, mechanicResponse]) => {
        setRequests(requestResponse.requests || []);
        setMechanics(
          (mechanicResponse.mechanics || mechanicResponse.data || []).filter(
            (mechanic) => mechanic.isActive !== false,
          ),
        );
      },
    );

  useEffect(() => {
    loadRequests()
      .catch((loadError) =>
        setError(loadError.message || "Failed to load service requests"),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const confirmAssignment = async (requestId, mechanicId) => {
    setSavingId(requestId);
    setError("");
    try {
      await api.confirmServiceRequest(requestId, mechanicId);
      await loadRequests();
    } catch (saveError) {
      setError(saveError.message || "Failed to confirm assignment");
    } finally {
      setSavingId("");
    }
  };

  const updateStatus = async (requestId, status) => {
    setSavingId(requestId);
    try {
      await api.updateAdminServiceRequestStatus(requestId, status);
      await loadRequests();
    } catch (saveError) {
      setError(saveError.message || "Failed to update booking status");
    } finally {
      setSavingId("");
    }
  };

  const saveLaborFee = async (request) => {
    const feeValue = laborFeeDrafts[request._id] ?? request.laborFee ?? 50;
    if (String(feeValue).trim() === "") {
      setError("Enter a valid non-negative labor fee.");
      return;
    }
    const laborFee = Number(feeValue);
    if (!Number.isFinite(laborFee) || laborFee < 0) {
      setError("Enter a valid non-negative labor fee.");
      return;
    }

    setSavingFeeId(request._id);
    setError("");
    try {
      await api.updateServiceRequestLaborFee(request._id, laborFee);
      await loadRequests();
      setLaborFeeDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[request._id];
        return nextDrafts;
      });
    } catch (saveError) {
      setError(saveError.message || "Failed to update labor fee");
    } finally {
      setSavingFeeId("");
    }
  };

  return (
    <AdminPageFrame>
      <section className="admin-management-section">
        <div className="mechanics-container">
          {error && (
            <p className="dashboard-error" role="alert">
              {error}
            </p>
          )}
          <div className="mechanics-header">
            <h2>Service requests</h2>
          </div>
          {isLoading ? (
            <p>Loading service requests...</p>
          ) : !requests.length ? (
            <p>No service requests found.</p>
          ) : (
            requests.map((request) => (
              <article className="mechanic-card" key={request._id}>
                <div className="mechanic-header-row">
                  <div>
                    <div className="mechanic-name">
                      {request.serviceType.replaceAll("-", " ")}
                    </div>
                    <div className="mechanic-email">
                      {request.user
                        ? `${request.user.firstName || ""} ${request.user.lastName || ""}`.trim()
                        : "Customer"}
                    </div>
                    <p>{request.description}</p>
                    <small>
                      {request.scheduledDate
                        ? `Scheduled ${new Date(request.scheduledDate).toLocaleDateString("en-PH")}`
                        : "No date selected"}{" "}
                      · Customer price: ₱
                      {Number(request.estimatedPrice || 0).toLocaleString(
                        "en-PH",
                      )}{" "}
                      · Labor fee: ₱
                      {Number(request.laborFee ?? 50).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </small>
                  </div>
                  <span className={`status-badge status-${request.status}`}>
                    {request.status.replaceAll("-", " ")}
                  </span>
                </div>
                <div className="service-labor-fee-control">
                  <label>
                    Labor fee (₱)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        laborFeeDrafts[request._id] ?? request.laborFee ?? 50
                      }
                      aria-label={`Labor fee for ${request.serviceType}`}
                      onChange={(event) =>
                        setLaborFeeDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [request._id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    className="btn-small btn-edit"
                    type="button"
                    disabled={savingFeeId === request._id}
                    onClick={() => saveLaborFee(request)}
                  >
                    {savingFeeId === request._id ? "Saving..." : "Save fee"}
                  </button>
                </div>
                <div className="mechanic-actions">
                  <select
                    aria-label={`Assign mechanic for ${request.serviceType}`}
                    value={request.mechanic?._id || request.mechanic || ""}
                    disabled={savingId === request._id}
                    onChange={(event) =>
                      confirmAssignment(request._id, event.target.value)
                    }
                  >
                    <option value="">Select mechanic</option>
                    {mechanics.map((mechanic) => (
                      <option
                        key={mechanic.id || mechanic._id}
                        value={mechanic.id || mechanic._id}
                      >
                        {mechanic.firstName} {mechanic.lastName}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Update status for ${request.serviceType}`}
                    value={request.status}
                    disabled={savingId === request._id}
                    onChange={(event) =>
                      updateStatus(request._id, event.target.value)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="accepted">Accepted</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </AdminPageFrame>
  );
}

export default ServiceRequests;
