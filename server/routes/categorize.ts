// Categorize Route Handler

import { FastifyRequest, FastifyReply } from "fastify";
import { generateContent, isAIInitialized } from "../services/ai.js";
import { CATEGORIZE_PROMPT } from "../prompts/index.js";

interface CategorizeBody {
    text: string;
    existingCategories?: string[];
    forceRecategorize?: boolean;
}

export async function categorize(
    request: FastifyRequest<{ Body: CategorizeBody }>,
    reply: FastifyReply
): Promise<void> {
    const { text, existingCategories = [], forceRecategorize = false } = request.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
        reply.code(400).send({ error: "Missing or invalid text field" });
        return;
    }

    if (!isAIInitialized()) {
        console.error("GEMINI_API_KEY not configured");
        reply.send({
            category: "Uncategorized",
            broadCategory: "Other",
        });
        return;
    }

    try {
        const prompt = CATEGORIZE_PROMPT(
            text,
            existingCategories,
            forceRecategorize
        );

        const responseText = await generateContent(prompt, {
            temperature: forceRecategorize ? 0.5 : 0.3,
            maxOutputTokens: 100,
        });

        const parsed = JSON.parse(responseText);
        const category = parsed.subcategory || parsed.category || "Uncategorized";
        const broadCategory = parsed.broadCategory || "Other";

        reply.send({
            category,
            broadCategory,
            subcategory: category,
        });
    } catch (err) {
        console.error("Error in /api/categorize:", err);
        reply.send({
            category: "Uncategorized",
            broadCategory: "Other",
        });
    }
}
