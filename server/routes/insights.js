// Insights Route Handler

import { generateContent, isAIInitialized } from "../services/ai.js";
import { INSIGHTS_PROMPT } from "../prompts.js";

export async function insights(req, res) {
  const {
    history = [],
    categories = [],
    weeklyTotals = {},
    monthlyTotals = {},
    yearlyTotals = {},
  } = req.body;

  if (!Array.isArray(history) || !Array.isArray(categories)) {
    return res.status(400).json({ error: "Invalid input format" });
  }

  if (!isAIInitialized()) {
    return res.json({ insight: "Unable to generate insights at this time." });
  }

  try {
    const prompt = INSIGHTS_PROMPT(
      history,
      categories,
      weeklyTotals,
      monthlyTotals,
      yearlyTotals
    );

    const responseText = await generateContent(prompt, {
      temperature: 0.5,
      maxOutputTokens: 150,
    });

    const parsed = JSON.parse(responseText);
    const insight = parsed.insight || "No significant patterns detected yet.";

    res.json({ insight });
  } catch (err) {
    console.error("Error in /api/insights:", err);
    res.json({ insight: "Unable to generate insights at this time." });
  }
}
