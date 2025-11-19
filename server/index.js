const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(bodyParser.json());

// Enable CORS for frontend communication
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/**
 * POST /api/categorize
 * Body: { text: string, existingCategories?: string[] }
 * Response: { category: string }
 *
 * Requires OPENAI_API_KEY in environment variables.
 */
app.post("/api/categorize", async (req, res) => {
  const { text, existingCategories = [] } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid text field" });
  }

  const categoriesList =
    existingCategories.length > 0 ? existingCategories.join(", ") : "None yet";

  const prompt = `You are Activity AI, an agent that classifies freeform human activities into short, human-friendly categories.

Rules:
- Return ONLY a category label.
- Category must be 1–3 words.
- Category must be general, not overly specific.
- Prefer using existing categories if provided.
- DO NOT output sentences, explanations, or lists.
- Capitalize each word in the category (e.g., "Home Improvement").
- If uncertain, return "General".

User activity: "${text}"
Existing categories: ${categoriesList}

Return JSON only: { "category": "<label>" }`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not found in environment variables");
      return res.json({ category: "Uncategorized" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Activity AI. Return only valid JSON with a category field.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.json({ category: "Uncategorized" });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.json({ category: "Uncategorized" });
    }

    const parsed = JSON.parse(content);
    const category = parsed.category || "Uncategorized";

    res.json({ category });
  } catch (err) {
    console.error("Error in /api/categorize:", err);
    res.json({ category: "Uncategorized" });
  }
});

/**
 * POST /api/insights
 * Body: { history: Activity[], categories: string[], weeklyTotals: {}, monthlyTotals: {}, yearlyTotals: {} }
 * Response: { insight: string }
 */
app.post("/api/insights", async (req, res) => {
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

  const prompt = `You are Activity AI Insights. You summarize trends in user activity.

Given:
- A list of past activities with timestamps
- A list of category-level time totals
- Weekly, monthly, and yearly totals

Tasks:
- Identify increases or decreases in activity.
- Highlight emerging patterns.
- Keep the insight under 2 sentences.
- Be neutral, encouraging, and factual.
- DO NOT make health claims.

Data:
Recent Activities: ${JSON.stringify(history.slice(-20))}
Categories: ${categories.join(", ")}
Weekly Totals: ${JSON.stringify(weeklyTotals)}
Monthly Totals: ${JSON.stringify(monthlyTotals)}
Yearly Totals: ${JSON.stringify(yearlyTotals)}

Return JSON: { "insight": "<short summary>" }`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ insight: "Unable to generate insights at this time." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Activity AI Insights. Return only valid JSON with an insight field.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.json({ insight: "Unable to generate insights at this time." });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.json({ insight: "No significant patterns detected yet." });
    }

    const parsed = JSON.parse(content);
    const insight = parsed.insight || "No significant patterns detected yet.";

    res.json({ insight });
  } catch (err) {
    console.error("Error in /api/insights:", err);
    res.json({ insight: "Unable to generate insights at this time." });
  }
});

/**
 * POST /api/merge-categories
 * Body: { categories: string[] }
 * Response: { merges: [{ from: string, into: string }] }
 */
app.post("/api/merge-categories", async (req, res) => {
  const { categories = [] } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: "Invalid or empty categories array" });
  }

  const prompt = `You help refine categories by identifying redundant or overlapping labels.

Given the following category list: ${categories.join(", ")}

Suggest merges only if categories describe the same thing or are very closely related.

Examples:
- "Running" and "Jogging" → merge "Jogging" into "Running"
- "Gym" and "Exercise" → merge "Gym" into "Exercise"
- "Breakfast" and "Meals" → merge "Breakfast" into "Meals"

Return JSON:
{ "merges": [ { "from": "<old>", "into": "<new>" } ] }

If no merges are needed, return:
{ "merges": [] }`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ merges: [] });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Activity AI Category Optimizer. Return only valid JSON with a merges array.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.json({ merges: [] });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.json({ merges: [] });
    }

    const parsed = JSON.parse(content);
    const merges = parsed.merges || [];

    res.json({ merges });
  } catch (err) {
    console.error("Error in /api/merge-categories:", err);
    res.json({ merges: [] });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI API server running at http://localhost:${PORT}`);
  console.log(
    `OpenAI API Key: ${
      process.env.OPENAI_API_KEY ? "✓ Configured" : "✗ Missing"
    }`
  );
});
