// Categorize Route Handler

import { generateContent, isAIInitialized } from "../services/ai.js";
import { CATEGORIZE_PROMPT } from "../prompts.js";

export async function categorize(req, res) {
  const { text, existingCategories = [], forceRecategorize = false } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid text field" });
  }

  if (!isAIInitialized()) {
    console.error("GEMINI_API_KEY not configured");
    return res.json({ category: "Uncategorized" });
  }

  try {
    const prompt = CATEGORIZE_PROMPT(
      text,
      existingCategories,
      forceRecategorize
    );

    const responseText = await generateContent(prompt, {
      temperature: forceRecategorize ? 0.5 : 0.3, // Higher temperature for recategorization
      maxOutputTokens: 50,
    });

    const parsed = JSON.parse(responseText);
    const category = parsed.category || "Uncategorized";

    res.json({ category });
  } catch (err) {
    console.error("Error in /api/categorize:", err);
    res.json({ category: "Uncategorized" });
  }
}
