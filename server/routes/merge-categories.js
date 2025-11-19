// Merge Categories Route Handler

import { generateContent, isAIInitialized } from "../services/ai.js";
import { MERGE_CATEGORIES_PROMPT } from "../prompts.js";

export async function mergeCategories(req, res) {
  const { categories = [] } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: "Invalid or empty categories array" });
  }

  if (!isAIInitialized()) {
    return res.json({ merges: [] });
  }

  try {
    const prompt = MERGE_CATEGORIES_PROMPT(categories);

    const responseText = await generateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 200,
    });

    const parsed = JSON.parse(responseText);
    const merges = parsed.merges || [];

    res.json({ merges });
  } catch (err) {
    console.error("Error in /api/merge-categories:", err);
    res.json({ merges: [] });
  }
}
