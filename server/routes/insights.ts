// Insights Route Handler

import { FastifyRequest, FastifyReply } from "fastify";
import { generateContent, isAIInitialized } from "../services/ai.js";
import { INSIGHTS_PROMPT } from "../prompts.js";

interface Activity {
    text: string;
    category: string;
    createdAt: number;
}

interface InsightsBody {
    history?: Activity[];
    categories?: string[];
    weeklyTotals?: Record<string, number>;
    monthlyTotals?: Record<string, number>;
    yearlyTotals?: Record<string, number>;
}

export async function insights(
    request: FastifyRequest<{ Body: InsightsBody }>,
    reply: FastifyReply
): Promise<void> {
    const {
        history = [],
        categories = [],
        weeklyTotals = {},
        monthlyTotals = {},
        yearlyTotals = {},
    } = request.body;

    if (!Array.isArray(history) || !Array.isArray(categories)) {
        reply.code(400).send({ error: "Invalid input format" });
        return;
    }

    if (!isAIInitialized()) {
        reply.send({ insight: "Unable to generate insights at this time." });
        return;
    }

    try {
        const prompt = INSIGHTS_PROMPT(
            history,
            categories,
            weeklyTotals,
            monthlyTotals,
            yearlyTotals
        );

        const responseText = await generateContent(prompt, {
            temperature: 0.5,
            maxOutputTokens: 150,
        });

        const parsed = JSON.parse(responseText);
        const insight = parsed.insight || "No significant patterns detected yet.";

        reply.send({ insight });
    } catch (err) {
        console.error("Error in /api/insights:", err);
        reply.send({ insight: "Unable to generate insights at this time." });
    }
}