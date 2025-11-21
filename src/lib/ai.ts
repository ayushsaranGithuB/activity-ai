// Gemini AI Service

import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export function initializeAI(apiKey: string | undefined): boolean {
    if (!apiKey) {
        console.warn("Gemini API key not provided");
        return false;
    }
    genAI = new GoogleGenAI({ apiKey });
    return true;
}

interface GenerateContentConfig {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
}

export async function generateContent(
    prompt: string | object,
    config: GenerateContentConfig = {}
): Promise<string> {
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

    console.log("🤖 Gemini API Request:");
    console.log("Model:", defaultConfig.model);
    console.log("Temperature:", defaultConfig.config.temperature);
    console.log("MaxOutputTokens:", defaultConfig.config.maxOutputTokens);
    if (typeof prompt === "string") {
        console.log("Prompt:", prompt);
    } else {
        console.log("Prompt Object:", JSON.stringify(prompt, null, 2));
    }
    console.log("Full Config:", JSON.stringify(defaultConfig, null, 2));

    const result = await genAI.models.generateContent(defaultConfig);
    console.log("✅ Gemini API Raw Response:", JSON.stringify(result, null, 2));
    let text = "";
    if (result && result.candidates && Array.isArray(result.candidates) && result.candidates[0]?.content?.parts?.[0]?.text) {
        text = result.candidates[0].content.parts[0].text;
    } else {
        console.warn("Gemini response did not contain usable text. Full result:", result);
        text = JSON.stringify({ raw: result });
    }
    const safeText = typeof text === "string" ? text : "";
    console.log("✅ Gemini API Response:", JSON.stringify({
        responseLength: safeText.length,
        response: safeText ? safeText.substring(0, 200) + (safeText.length > 200 ? "..." : "") : "[No text]",
    }, null, 2));
    return text;
}

export function isAIInitialized(): boolean {
    return genAI !== null;
}

export async function generateAISummary(
    prompt: string,
    config: GenerateContentConfig = {}
): Promise<string> {
    if (!genAI) {
        throw new Error("AI not initialized. Call initializeAI() first.");
    }

    const defaultConfig = {
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            temperature: 0.8,
            maxOutputTokens: 200,
            responseMimeType: "text/plain",
            ...config,
        },
    };

    console.log("🤖 Gemini API Request (Summary):", {
        model: defaultConfig.model,
        temperature: defaultConfig.config.temperature,
        maxOutputTokens: defaultConfig.config.maxOutputTokens,
    });

    const result = await genAI.models.generateContent(defaultConfig);
    console.log("✅ Gemini API Raw Response (Summary):", JSON.stringify(result, null, 2));
    let text = "";
    if (result && result.candidates && Array.isArray(result.candidates) && result.candidates[0]?.content?.parts?.[0]?.text) {
        text = result.candidates[0].content.parts[0].text;
    } else {
        console.warn("Gemini response did not contain usable text. Full result:", result);
        text = JSON.stringify({ raw: result });
    }
    const safeText = typeof text === "string" ? text : "";
    console.log("✅ Gemini API Response (Summary):", JSON.stringify({
        responseLength: safeText.length,
        response: safeText ? safeText.substring(0, 200) + (safeText.length > 200 ? "..." : "") : "[No text]",
    }, null, 2));
    return text;
}
