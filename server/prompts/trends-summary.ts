interface TrendData {
    category: string;
    activityCount: number;
    totalMinutes: number;
}

interface ActivityData {
    text: string;
    category: string;
    createdAt: number;
}

export const getTrendsSummaryPrompt = (
    period: "day" | "week" | "month" | "year",
    trends: TrendData[],
    totalActivities: number,
    activities: ActivityData[]
): string => {
    const topCategories = trends
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 3)
        .map((t) => `${t.category} (${t.activityCount} activities)`);

    const recentActivities = activities
        .slice(-5)
        .map((a) => `- ${a.text}`)
        .join("\n");

    switch (period) {
        case "day":
            return [
                "Summarize today's activities pragmatically. Focus on what was done, top categories, and any notable patterns. No need for warmth or encouragement—just the facts and insights.",
                "",
                `Period: day`,
                `Total Activities: ${totalActivities}`,
                `Top Categories: ${topCategories.join(', ')}`,
                "",
                "Recent activities:",
                recentActivities,
                "",
                "Generate a concise summary (1 sentence only):",
            ].join("\n");

        case "week":
            return [
                "You are Activity AI, a friendly and encouraging assistant that helps users reflect on their activities.",
                "",
                "Review this week's progress, consistency, and patterns. Emphasize building habits and acknowledge steady improvement.",
                "",
                "Generate a warm, personalized summary of the user's activities for this week. Be encouraging and conversational.",
                "",
                "Guidelines:",
                "- Keep it to 2-3 sentences",
                "- Highlight their top activities or interesting patterns",
                "- Use a friendly, conversational tone",
                "- Don't be overly formal or robotic",
                "- Focus on what they accomplished, not just numbers",
                "- Add one helpful suggestion for next week based on their activities",
                "",
                `Period: week`,
                `Total Activities: ${totalActivities}`,
                `Top Categories: ${topCategories.join(', ')}`,
                "",
                "Recent activities:",
                recentActivities,
                "",
                "Generate a friendly summary (2-3 sentences only):",
            ].join("\n");

        case "month":
            return [
                "You are Activity AI, that helps users reflect on their activities.",
                "",
                "Summarize monthly achievements, growth, and bigger trends. Highlight milestones and encourage continued growth next month.",
                "",
                "",
                "Guidelines:",
                "- Keep it to 2-3 sentences",
                "- Highlight their top activities or interesting patterns",
                "- Use a friendly, conversational tone",
                "- Don't be overly formal or robotic",
                "- Focus on what they accomplished, not just numbers",
                "- Add one critical suggestion for next month based on their activities",
                "",
                `Period: month`,
                `Total Activities: ${totalActivities}`,
                `Top Categories: ${topCategories.join(', ')}`,
                "",
                "Recent activities:",
                recentActivities,
                "",
                "Generate a friendly summary (2-3 sentences only):",
            ].join("\n");

        default:
            return [
                "Reflect on your activities for this period.",
                "",
                `Period: ${period}`,
                `Total Activities: ${totalActivities}`,
                `Top Categories: ${topCategories.join(', ')}`,
                "",
                "Recent activities:",
                recentActivities,
                "",
                "Generate a summary (2-3 sentences only):",
            ].join("\n");
    }

};
