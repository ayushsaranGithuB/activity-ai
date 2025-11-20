import { FastifyRequest, FastifyReply } from "fastify";
import { generateAISummary } from "../services/ai.js";
import { getTrendsSummaryPrompt } from "../prompts/index.js";

interface TrendData {
    category: string;
    activityCount: number;
    totalMinutes: number;
}

interface TrendsSummaryBody {
    period: "week" | "month" | "year";
    trends: TrendData[];
    totalActivities: number;
    activities: Array<{
        text: string;
        category: string;
        createdAt: number;
    }>;
}

export async function trendsSummary(
    request: FastifyRequest<{ Body: TrendsSummaryBody }>,
    reply: FastifyReply
): Promise<void> {
    try {
        const { period, trends, totalActivities, activities } = request.body;

        if (!trends || !Array.isArray(trends)) {
            reply.code(400).send({ error: "Trends data is required" });
            return;
        }

        const prompt = getTrendsSummaryPrompt(
            period,
            trends,
            totalActivities,
            activities
        );

        console.log("\n📊 Generating trends summary:", {
            period,
            trendsCount: trends.length,
            totalActivities,
        });

        const summary = await generateAISummary(prompt);

        console.log("✅ Generated summary:", summary.substring(0, 100) + "...");

        reply.send({ summary });
    } catch (error) {
        console.error("❌ Error generating trends summary:", error);
        reply.code(500).send({ error: "Failed to generate summary" });
    }
}
