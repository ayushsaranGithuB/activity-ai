// Trend Aggregation Logic for Activity AI

import type {
    Activity,
    Category,
    TrendData,
    CategoryTrend,
    TrendPeriod,
    TrendComparison,
    TrendChange,
} from "../types";

// ============================================================================
// Date Utilities
// ============================================================================

export function getStartOfWeek(timestamp: number): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
}

export function getStartOfMonth(timestamp: number): number {
    const date = new Date(timestamp);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

export function getStartOfYear(timestamp: number): number {
    const date = new Date(timestamp);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

export function getPeriodRange(
    period: "week" | "month" | "year",
    timestamp: number = Date.now()
): TrendPeriod {
    let start: number;
    let end: number;
    let label: string;

    switch (period) {
        case "week":
            start = getStartOfWeek(timestamp);
            end = start + 7 * 24 * 60 * 60 * 1000 - 1;
            label = new Date(start).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
            break;
        case "month":
            start = getStartOfMonth(timestamp);
            const nextMonth = new Date(start);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            end = nextMonth.getTime() - 1;
            label = new Date(start).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
            break;
        case "year":
            start = getStartOfYear(timestamp);
            end = new Date(new Date(start).getFullYear() + 1, 0, 1).getTime() - 1;
            label = new Date(start).getFullYear().toString();
            break;
    }

    return { start, end, label };
}

// ============================================================================
// Trend Calculation
// ============================================================================

export function calculateCategoryTrends(
    activities: Activity[],
    period: "week" | "month" | "year"
): CategoryTrend[] {
    const { start, end } = getPeriodRange(period);

    // Filter activities in the current period
    const periodActivities = activities.filter(
        (a) => a.createdAt >= start && a.createdAt <= end
    );

    // Group by category
    const categoryMap = new Map<string, Activity[]>();
    for (const activity of periodActivities) {
        const existing = categoryMap.get(activity.category) || [];
        existing.push(activity);
        categoryMap.set(activity.category, existing);
    }

    // Calculate trends
    const trends: CategoryTrend[] = [];
    const totalActivities = periodActivities.length;
    const daysInPeriod = (end - start) / (24 * 60 * 60 * 1000);

    for (const [category, categoryActivities] of categoryMap.entries()) {
        const activityCount = categoryActivities.length;
        const totalMinutes = activityCount * 30; // Assume 30 min per activity (can be customized)
        const averagePerDay = activityCount / daysInPeriod;
        const percentageOfTotal =
            totalActivities > 0 ? (activityCount / totalActivities) * 100 : 0;

        trends.push({
            category,
            totalMinutes,
            activityCount,
            averagePerDay,
            percentageOfTotal,
        });
    }

    // Sort by activity count (descending)
    trends.sort((a, b) => b.activityCount - a.activityCount);

    return trends;
}

export function calculateAllTrends(activities: Activity[]): TrendData {
    return {
        weekly: trendArrayToRecord(calculateCategoryTrends(activities, "week")),
        monthly: trendArrayToRecord(calculateCategoryTrends(activities, "month")),
        yearly: trendArrayToRecord(calculateCategoryTrends(activities, "year")),
    };
}

function trendArrayToRecord(
    trends: CategoryTrend[]
): Record<string, CategoryTrend> {
    return trends.reduce((acc, trend) => {
        acc[trend.category] = trend;
        return acc;
    }, {} as Record<string, CategoryTrend>);
}

// ============================================================================
// Trend Comparison
// ============================================================================

export function compareTrends(
    currentActivities: Activity[],
    previousActivities: Activity[],
    period: "week" | "month" | "year"
): TrendComparison {
    const current = calculateCategoryTrends(currentActivities, period);
    const previous = calculateCategoryTrends(previousActivities, period);

    const changes: TrendChange[] = [];
    const previousMap = new Map(previous.map((t) => [t.category, t]));

    for (const currentTrend of current) {
        const previousTrend = previousMap.get(currentTrend.category);

        if (previousTrend) {
            const change =
                ((currentTrend.activityCount - previousTrend.activityCount) /
                    previousTrend.activityCount) *
                100;

            let direction: "up" | "down" | "stable";
            let significance: "major" | "minor" | "none";

            if (Math.abs(change) < 5) {
                direction = "stable";
                significance = "none";
            } else if (change > 0) {
                direction = "up";
                significance = change > 25 ? "major" : "minor";
            } else {
                direction = "down";
                significance = change < -25 ? "major" : "minor";
            }

            changes.push({
                category: currentTrend.category,
                change: Math.round(change),
                direction,
                significance,
            });
        } else {
            // New category
            changes.push({
                category: currentTrend.category,
                change: 100,
                direction: "up",
                significance: "major",
            });
        }
    }

    return { current, previous, changes };
}

// ============================================================================
// Summary Generation
// ============================================================================

export function generateTrendSummary(trends: CategoryTrend[]): string {
    if (trends.length === 0) {
        return "No activities logged yet.";
    }

    const topCategory = trends[0];
    const total = trends.reduce((sum, t) => sum + t.activityCount, 0);

    return `You've logged ${total} activities. ${topCategory.category} is your most frequent activity (${topCategory.activityCount} times, ${Math.round(topCategory.percentageOfTotal || 0)}% of total).`;
}

export function generateComparisonSummary(
    comparison: TrendComparison
): string {
    if (comparison.changes.length === 0) {
        return "Not enough data for comparison.";
    }

    const majorChanges = comparison.changes.filter(
        (c) => c.significance === "major"
    );

    if (majorChanges.length === 0) {
        return "Your activity patterns have remained relatively stable.";
    }

    const increases = majorChanges.filter((c) => c.direction === "up");
    const decreases = majorChanges.filter((c) => c.direction === "down");

    let summary = "";

    if (increases.length > 0) {
        const topIncrease = increases[0];
        summary += `${topIncrease.category} increased by ${topIncrease.change}%. `;
    }

    if (decreases.length > 0) {
        const topDecrease = decreases[0];
        summary += `${topDecrease.category} decreased by ${Math.abs(topDecrease.change)}%.`;
    }

    return summary.trim();
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

export function aggregateByCategory(
    activities: Activity[]
): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const activity of activities) {
        counts[activity.category] = (counts[activity.category] || 0) + 1;
    }

    return counts;
}

export function aggregateByTimeOfDay(
    activities: Activity[]
): Record<string, number> {
    const bins: Record<string, number> = {
        morning: 0, // 6-12
        afternoon: 0, // 12-18
        evening: 0, // 18-24
        night: 0, // 0-6
    };

    for (const activity of activities) {
        const hour = new Date(activity.createdAt).getHours();
        if (hour >= 6 && hour < 12) bins.morning++;
        else if (hour >= 12 && hour < 18) bins.afternoon++;
        else if (hour >= 18 && hour < 24) bins.evening++;
        else bins.night++;
    }

    return bins;
}

export function aggregateByDayOfWeek(
    activities: Activity[]
): Record<string, number> {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts: Record<string, number> = {};
    days.forEach((day) => (counts[day] = 0));

    for (const activity of activities) {
        const day = days[new Date(activity.createdAt).getDay()];
        counts[day]++;
    }

    return counts;
}
