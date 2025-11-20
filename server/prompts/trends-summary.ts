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
    period: "week" | "month" | "year",
    trends: TrendData[],
    totalActivities: number,
    activities: ActivityData[]
): string => {
    const topCategories = trends
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 3)
        .map((t) => `${t.category} (${t.activityCount} activities)`);

    return `You are Activity AI, a friendly and encouraging assistant that helps users reflect on their activities.

Generate a warm, personalized summary of the user's activities for this ${period}. Be encouraging and conversational.

Guidelines:
- Keep it to 2-3 sentences
- Be positive and motivating
- Highlight their top activities or interesting patterns
- Use a friendly, conversational tone
- Don't be overly formal or robotic
- Focus on what they accomplished, not just numbers
- Add one helpful suggestion for next period based on their activities

Period: ${period}
Total Activities: ${totalActivities}
Top Categories: ${topCategories.join(", ")}

Recent activities:
${activities
            .slice(-5)
            .map((a) => `- ${a.text}`)
            .join("\n")}

Generate a friendly summary (2-3 sentences only):`;
};
