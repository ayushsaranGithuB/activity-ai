const express = require("express");
const bodyParser = require("body-parser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(bodyParser.json());

/**
 * POST /api/categorize
 * Body: { text: string }
 * Response: { category: string }
 *
 * Requires OPENAI_API_KEY in environment variables.
 */
app.post("/api/categorize", async (req, res) => {
  const text = req.body?.text;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const prompt = `
You categorize user activities into short, human-readable labels.
Return ONLY the category label, nothing else.

Activity: "${text}"
Category:
  `;

  try {
    const r = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt,
        max_tokens: 10,
        temperature: 0.2,
      }),
    });

    const j = await r.json();
    const category = j.choices?.[0]?.text?.trim() || "Uncategorized";

    res.json({ category });
  } catch (err) {
    console.error(err);
    res.json({ category: "Uncategorized" });
  }
});

app.listen(3000, () => {
  console.log("AI API server running at http://localhost:3000");
});
