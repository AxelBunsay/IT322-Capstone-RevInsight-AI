const { GoogleGenerativeAI } = require('@google/generative-ai');

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

  const modelNames = [
    process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    process.env.GEMINI_FALLBACK_MODEL
  ].filter(Boolean);

  let lastError;

  for (const modelName of modelNames) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const model = gemini.getGenerativeModel({
          model: modelName,
          systemInstruction: 'You are a helpful revenue analyst for a motorcycle parts business.'
        });

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (error) {
        lastError = error;

        if (error.status !== 503 || attempt === 2) {
          break;
        }

        await wait(1500);
      }
    }
  }

  throw lastError;
}

module.exports = { generateRevenueInsights };