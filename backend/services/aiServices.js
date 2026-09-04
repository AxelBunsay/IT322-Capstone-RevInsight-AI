const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

async function generateRevenueInsights(question, revenueData) {
  const prompt = `
You are a revenue analyst for a motorcycle parts shop.
Answer the user's question based on the revenue data provided.

Revenue Data:
${JSON.stringify(revenueData, null, 2)}

User Question: ${question}

Provide a concise, actionable response with specific numbers from the data.
Focus on trends, anomalies, and actionable insights.
  `.trim();

  const completion = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.3,
    system: 'You are a helpful revenue analyst for a motorcycle parts business.',
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.content[0].text.trim();
}

module.exports = { generateRevenueInsights };