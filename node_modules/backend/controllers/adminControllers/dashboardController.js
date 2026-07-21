const Order = require('../../models/orderingModels/order');
const Product = require('../../models/product');
const User = require('../../models/user');
const Mechanic = require('../../models/mechanic');
const ServiceRequest = require('../../models/serviceRequest');

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalRevenue = await Order.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalTransactions = await Order.countDocuments({ status: 'Paid' });
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Revenue Data
exports.getRevenueData = async (req, res) => {
    try {
        const revenueByMonth = await Order.aggregate([
            { $match: { status: 'Paid' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' },
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Quarterly Data
exports.getQuarterlyData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;

        const quarterlyData = await Order.aggregate([
            { $match: { status: 'Paid' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
                    },
                    revenue: { $sum: '$totalAmount' },
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Daily Data
exports.getDailyData = async (req, res) => {
    try {
        const lastSevenDays = new Date();
        lastSevenDays.setDate(lastSevenDays.getDate() - 7);

        const dailyData = await Order.aggregate([
            {
                $match: {
                    status: 'Paid',
                    createdAt: { $gte: lastSevenDays }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Revenue Risk
exports.getRevenueRisk = async (req, res) => {
    try {
        const revenueByCategory = await Order.aggregate([
            { $match: { status: 'Paid' } },
            {
                $group: {
                    _id: '$category',
                    revenue: { $sum: '$totalAmount' },
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Projected Revenue
exports.getProjectedRevenue = async (req, res) => {
    try {
        const projectedData = await Order.aggregate([
            { $match: { status: 'Paid' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } }
                    },
                    revenue: { $sum: '$totalAmount' }
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Transactions
exports.getAllTransactions = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Transaction by ID
exports.getTransactionById = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create Transaction
exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Order(req.body);
        await transaction.save();

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Transaction
exports.updateTransaction = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Inventory
exports.getAllInventory = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Inventory Item
exports.getInventoryItem = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add Inventory Item
exports.addInventoryItem = async (req, res) => {
    try {
        const item = new Product(req.body);
        await item.save();

        res.status(201).json({
            success: true,
            message: 'Inventory item added successfully',
            data: item
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Inventory Item
exports.updateInventoryItem = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Inventory Item
exports.deleteInventoryItem = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Sales Report
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { status: 'Paid' };

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
                    totalSales: { $sum: '$totalAmount' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: report[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Inventory Report
exports.getInventoryReport = async (req, res) => {
    try {
        const lowStockItems = await Product.find({ stock: { $lt: 5 } });
        const totalInventoryValue = await Product.aggregate([
            { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } }
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
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Mechanics Report
exports.getMechanicsReport = async (req, res) => {
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
        res.status(500).json({ success: false, message: error.message });
    }
};
