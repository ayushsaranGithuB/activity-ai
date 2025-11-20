// Merge Categories Route Handler

import { FastifyRequest, FastifyReply } from "fastify";
import { generateContent } from "../services/ai.js";
import { MERGE_CATEGORIES_PROMPT } from "../prompts/index.js";

interface MergeCategoriesBody {
    categories?: string[];
}

export async function mergeCategories(
    request: FastifyRequest<{ Body: MergeCategoriesBody }>,
    reply: FastifyReply
): Promise<void> {
    const { categories = [] } = request.body;

    if (!Array.isArray(categories) || categories.length === 0) {
        reply.code(400).send({ error: "Invalid or empty categories array" });
        return;
    }

    if (!isAIInitialized()) {
        reply.send({ merges: [] });
        return;
    }

    try {
        const prompt = MERGE_CATEGORIES_PROMPT(categories);

        const responseText = await generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: 200,
        });

        const parsed = JSON.parse(responseText);
        const merges = parsed.merges || [];

        reply.send({ merges });
    } catch (err) {
        console.error("Error in /api/merge-categories:", err);
        reply.send({ merges: [] });
    }
}