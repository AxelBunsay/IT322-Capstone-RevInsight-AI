const { generateRevenueInsights } = require('../../services/aiService');
const dashboardController = require('./dashboardController');

async function askRevenueAI(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Fetch current revenue data using existing dashboard controller methods
    const mockReq = { ...req, query: {} };
    const mockRes = {
      json: (data) => data,
      status: (code) => ({ json: (data) => ({ status: code, ...data }) })
    };

    const [statsRes, quarterlyRes, dailyRes] = await Promise.all([
      dashboardController.getDashboardStats(mockReq, mockRes),
      dashboardController.getQuarterlyData(mockReq, mockRes),
      dashboardController.getDailyData(mockReq, mockRes)
    ]);

    const revenueData = {
      stats: statsRes.data,
      quarterly: quarterlyRes.data,
      daily: dailyRes.data
    };

    const answer = await generateRevenueInsights(question, revenueData);

    res.json({
      success: true,
      question,
      answer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[askRevenueAI] error', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI insights' });
  }
}

module.exports = { askRevenueAI };