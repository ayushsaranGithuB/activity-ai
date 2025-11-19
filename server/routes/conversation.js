// Conversation Route Handler

import { generateContent, isAIInitialized } from "../services/ai.js";
import { CONVERSATION_PROMPT } from "../prompts.js";

export async function conversation(req, res) {
  console.log("\n📨 Received conversation request", {
    userMessage: req.body.userMessage,
    historyLength: req.body.conversationHistory?.length || 0,
  });

  const {
    userMessage,
    conversationHistory = [],
    existingCategories = [],
  } = req.body;

  if (
    !userMessage ||
    typeof userMessage !== "string" ||
    userMessage.trim().length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid userMessage field" });
  }

  if (!isAIInitialized()) {
    console.error("GEMINI_API_KEY not configured");
    return res.json({
      assistantMessage:
        "I'm sorry, I'm not configured properly. Please check the server setup.",
      needsFollowUp: false,
      readyToSave: false,
    });
  }

  try {
    const prompt = CONVERSATION_PROMPT(
      userMessage,
      conversationHistory,
      existingCategories
    );

    const responseText = await generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 200,
    });

    const parsed = JSON.parse(responseText);

    const response = {
      assistantMessage: parsed.assistantMessage || "I see!",
      needsFollowUp: parsed.needsFollowUp || false,
      readyToSave: parsed.readyToSave || false,
    };

    // If ready to save, include the activity details
    if (parsed.readyToSave && parsed.activityText) {
      response.activityToSave = {
        text: parsed.activityText,
        category: parsed.category || "General",
      };
    }

    res.json(response);
  } catch (err) {
    console.error("Error in /api/conversation:", err);
    res.status(500).json({
      error: "Failed to process conversation",
      assistantMessage:
        "I'm having trouble understanding. Could you rephrase that?",
      needsFollowUp: false,
      readyToSave: false,
    });
  }
}
