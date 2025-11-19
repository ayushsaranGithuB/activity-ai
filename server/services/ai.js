// Gemini AI Service

import { GoogleGenAI } from "@google/genai";

let genAI = null;

export function initializeAI(apiKey) {
  if (!apiKey) {
    console.warn("Gemini API key not provided");
    return false;
  }
  genAI = new GoogleGenAI(apiKey);
  return true;
}

export async function generateContent(prompt, config = {}) {
  if (!genAI) {
    throw new Error("AI not initialized. Call initializeAI() first.");
  }

  const defaultConfig = {
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 100,
      responseMimeType: "application/json",
      ...config,
    },
  };

  console.log("🤖 Gemini API Request:", {
    model: defaultConfig.model,
    temperature: defaultConfig.config.temperature,
    maxOutputTokens: defaultConfig.config.maxOutputTokens,
    promptLength:
      typeof prompt === "string"
        ? prompt.length
        : JSON.stringify(prompt).length,
  });

  const result = await genAI.models.generateContent(defaultConfig);

  console.log("✅ Gemini API Response:", {
    responseLength: result.text.length,
    response:
      result.text.substring(0, 200) + (result.text.length > 200 ? "..." : ""),
  });

  return result.text;
}

export function isAIInitialized() {
  return genAI !== null;
}
