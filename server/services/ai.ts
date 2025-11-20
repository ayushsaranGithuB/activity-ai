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
    const text = result.text || "";

    console.log("✅ Gemini API Response:", {
        responseLength: text.length,
        response: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
    });

    return text;
}

export function isAIInitialized(): boolean {
    return genAI !== null;
}
