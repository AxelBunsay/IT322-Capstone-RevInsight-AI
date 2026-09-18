const { generateRevenueInsights } = require('../../services/aiService');
const dashboardController = require('./dashboardController');

async function getControllerResult(controller, req) {
  let result;
  const response = {
    json: (data) => {
      result = data;
      return data;
    },
    status: (code) => ({
      json: (data) => {
        result = { ...data, status: code };
        return result;
      }
    })
  };

  await controller(req, response);
  return result;
}

async function askRevenueAI(req, res) {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Fetch current revenue data
    const mockReq = { ...req, query: {} };
    const [statsRes, quarterlyRes, dailyRes] = await Promise.all([
      getControllerResult(dashboardController.getDashboardStats, mockReq),
      getControllerResult(dashboardController.getQuarterlyData, mockReq),
      getControllerResult(dashboardController.getDailyData, mockReq)
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