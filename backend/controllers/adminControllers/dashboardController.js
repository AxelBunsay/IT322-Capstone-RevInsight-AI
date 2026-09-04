const Order = require('../../models/orderingModels/order');
const Product = require('../../models/product');
const User = require('../../models/user');
const Mechanic = require('../../models/mechanic');
const ServiceRequest = require('../../models/serviceRequest');

const revenueStatuses = ['completed', 'Paid'];
const revenueAmount = { $ifNull: ['$totalPrice', '$totalAmount'] };

// Get Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      { $group: { _id: null, total: { $sum: revenueAmount } } }
    ]);

    const totalTransactions = await Order.countDocuments({ status: { $in: revenueStatuses } });
    const totalInventoryItems = await Product.countDocuments();
    const totalMechanics = await Mechanic.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalTransactions,
        totalInventoryItems,
        totalMechanics,
        totalUsers,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('[getDashboardStats] error', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard stats. Please try again.' });
  }
};

// Get Revenue Data
const getRevenueData = async (req, res) => {
  try {
    const revenueByMonth = await Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: revenueAmount },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: revenueByMonth
    });
  } catch (error) {
    console.error('[getRevenueData] error', error);
    res.status(500).json({ success: false, message: 'Failed to load revenue data. Please try again.' });
  }
};

// Get Quarterly Data
const getQuarterlyData = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    const quarterlyData = await Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
          },
          revenue: { $sum: revenueAmount },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.quarter': 1 } }
    ]);

    res.json({
      success: true,
      data: quarterlyData
    });
  } catch (error) {
    console.error('[getQuarterlyData] error', error);
    res.status(500).json({ success: false, message: 'Failed to load quarterly data. Please try again.' });
  }
};

// Get Daily Data
const getDailyData = async (req, res) => {
  try {
    const lastSevenDays = new Date();
    lastSevenDays.setDate(lastSevenDays.getDate() - 7);

    const dailyData = await Order.aggregate([
      {
        $match: {
          status: { $in: revenueStatuses },
          createdAt: { $gte: lastSevenDays }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: revenueAmount },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: dailyData
    });
  } catch (error) {
    console.error('[getDailyData] error', error);
    res.status(500).json({ success: false, message: 'Failed to load daily data. Please try again.' });
  }
};

// Get Revenue Risk
const getRevenueRisk = async (req, res) => {
  try {
    const revenueByCategory = await Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      {
        $group: {
          _id: '$category',
          revenue: { $sum: revenueAmount },
          percentage: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = revenueByCategory.reduce((sum, item) => sum + item.revenue, 0);

    const topCategory = revenueByCategory[0];
    const riskLevel = topCategory && (topCategory.revenue / totalRevenue) > 0.8 ? 'High' : 'Low';

    res.json({
      success: true,
      data: {
        totalRevenue,
        riskLevel,
        topCategory: topCategory?.category,
        concentration: topCategory ? (topCategory.revenue / totalRevenue * 100).toFixed(2) : 0,
        byCategory: revenueByCategory
      }
    });
  } catch (error) {
    console.error('[getRevenueRisk] error', error);
    res.status(500).json({ success: false, message: 'Failed to load revenue risk data. Please try again.' });
  }
};

// Get Projected Revenue
const getProjectedRevenue = async (req, res) => {
  try {
    const projectedData = await Order.aggregate([
      { $match: { status: { $in: revenueStatuses } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
          },
          revenue: { $sum: revenueAmount }
        }
      },
      { $sort: { '_id.year': 1, '_id.quarter': 1 } },
      { $limit: 3 }
    ]);

    res.json({
      success: true,
      data: projectedData
    });
  } catch (error) {
    console.error('[getProjectedRevenue] error', error);
    res.status(500).json({ success: false, message: 'Failed to load projected revenue data. Please try again.' });
  }
};

// Get All Transactions
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = null } = req.query;
    const query = status ? { status } : {};

    const transactions = await Order.find(query)
      .populate('userId', 'name email')
      .populate('mechanicId', 'name specialty')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('[getAllTransactions] error', error);
    res.status(500).json({ success: false, message: 'Failed to load transactions. Please try again.' });
  }
};

// Get Transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Order.findById(req.params.id)
      .populate('userId')
      .populate('mechanicId')
      .populate('items.productId');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('[getTransactionById] error', error);
    res.status(500).json({ success: false, message: 'Failed to load transaction. Please try again.' });
  }
};

// Create Transaction
const createTransaction = async (req, res) => {
  try {
    const transaction = new Order(req.body);
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('[createTransaction] error', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction. Please try again.' });
  }
};

// Update Transaction
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('[updateTransaction] error', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction. Please try again.' });
  }
};

// Delete Transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Order.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('[deleteTransaction] error', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction. Please try again.' });
  }
};

// Get All Inventory
const getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;

    const inventory = await Product.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments();

    res.json({
      success: true,
      data: inventory,
      pagination: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('[getAllInventory] error', error);
    res.status(500).json({ success: false, message: 'Failed to load inventory. Please try again.' });
  }
};

// Get Inventory Item
const getInventoryItem = async (req, res) => {
  try {
    const item = await Product.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('[getInventoryItem] error', error);
    res.status(500).json({ success: false, message: 'Failed to load inventory item. Please try again.' });
  }
};

// Add Inventory Item
const addInventoryItem = async (req, res) => {
  try {
    const item = new Product(req.body);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: item
    });
  } catch (error) {
    console.error('[addInventoryItem] error', error);
    res.status(500).json({ success: false, message: 'Failed to add inventory item. Please try again.' });
  }
};

// Update Inventory Item
const updateInventoryItem = async (req, res) => {
  try {
    const item = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('[updateInventoryItem] error', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory item. Please try again.' });
  }
};

// Delete Inventory Item
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('[deleteInventoryItem] error', error);
    res.status(500).json({ success: false, message: 'Failed to delete inventory item. Please try again.' });
  }
};

// Get Sales Report
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: { $in: revenueStatuses } };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const report = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: revenueAmount },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: revenueAmount }
        }
      }
    ]);

    res.json({
      success: true,
      data: report[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 }
    });
  } catch (error) {
    console.error('[getSalesReport] error', error);
    res.status(500).json({ success: false, message: 'Failed to load sales report. Please try again.' });
  }
};

// Get Inventory Report
const getInventoryReport = async (req, res) => {
  try {
    const lowStockItems = await Product.find({ quantity: { $lt: 5 } });
    const totalInventoryValue = await Product.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } }
    ]);

    res.json({
      success: true,
      data: {
        lowStockItems,
        totalItems: await Product.countDocuments(),
        totalInventoryValue: totalInventoryValue[0]?.totalValue || 0
      }
    });
  } catch (error) {
    console.error('[getInventoryReport] error', error);
    res.status(500).json({ success: false, message: 'Failed to load inventory report. Please try again.' });
  }
};

// Get Mechanics Report
const getMechanicsReport = async (req, res) => {
  try {
    const mechanicsReport = await Mechanic.aggregate([
      {
        $lookup: {
          from: 'ServiceRequest',
          localField: '_id',
          foreignField: 'mechanicId',
          as: 'jobs'
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          specialty: { $first: '$specialty' },
          totalJobs: { $size: '$jobs' },
          completedJobs: {
            $sum: {
              $cond: [{ $eq: ['$jobs.status', 'Completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: mechanicsReport
    });
  } catch (error) {
    console.error('[getMechanicsReport] error', error);
    res.status(500).json({ success: false, message: 'Failed to load mechanics report. Please try again.' });
  }
};



module.exports = {
  getDashboardStats,
  getRevenueData,
  getQuarterlyData,
  getDailyData,
  getRevenueRisk,
  getProjectedRevenue,
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAllInventory,
  getInventoryItem,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getSalesReport,
  getInventoryReport,
  getMechanicsReport
};