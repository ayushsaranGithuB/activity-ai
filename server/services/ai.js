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
    model: "gemini-2.0-flash-lite",
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 100,
      responseMimeType: "application/json",
      ...config,
    },
  };

  const result = await genAI.models.generateContent(defaultConfig);
  return result.text;
}

export function isAIInitialized() {
  return genAI !== null;
}
