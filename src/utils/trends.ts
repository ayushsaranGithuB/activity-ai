import { suggestIconForName } from "@/lib/iconSuggestions";
import type { CategoryItem } from "@/types/categoryItem";
import type { ActivityLogItem, TrendDataCategory } from "@/types";
import { Capacitor } from "@capacitor/core";
import { TREND_SUMMARY_PROMPT } from "@/prompts/trendSummaryPrompt";
import { TODAY_SUMMARY_PROMPT } from "@/prompts/todayPrompt";
import { callModel } from "@/agent/model";

// Parse timestamps returned from SQLite/DB. SQLite CURRENT_TIMESTAMP returns
// strings like "YYYY-MM-DD HH:MM:SS" (UTC) — these lack a timezone marker
// so `new Date(...)` may be interpreted as local. Append a 'Z' when the
// string matches the common UTC format so the Date is constructed from UTC.
function parseTimestampToDate(ts: string) {
    if (!ts) return new Date(NaN);
    const sqliteUtcPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    try {
        if (sqliteUtcPattern.test(ts)) {
            return new Date(ts.replace(" ", "T") + "Z");
        }
        return new Date(ts);
    } catch (e) {
        console.warn("Failed to parse timestamp:", ts, e);
        return new Date(NaN);
    }
}

export interface LoadTrendsResult {
    today: TrendDataCategory[];
    week: TrendDataCategory[];
    month: TrendDataCategory[];
    aiToday: string;
    aiWeek: string;
    aiMonth: string;
}

export async function loadTrends(): Promise<LoadTrendsResult> {
    let activities: ActivityLogItem[] = [];
    let categories: CategoryItem[] = [];

    if (Capacitor.isNativePlatform()) {
        const tools = await import("@/agent/tools");

        activities =
            (await tools.dbQuery(
                "SELECT id, description, category_id, length_mins, timestamp, sub_category FROM activities ORDER BY timestamp DESC"
            )) || [];

        categories =
            (await tools.dbQuery(
                "SELECT id, name, icon FROM categories ORDER BY id ASC"
            )) || [];
    } else {
        activities = (await import("@/db/dummyData/sample-activities")).sample_activities;

        try {
            categories = [
                { id: 1, name: "Exercise" },
                { id: 2, name: "Meals" },
                { id: 3, name: "Work" },
                { id: 4, name: "Learning" },
                { id: 5, name: "Entertainment" },
                { id: 6, name: "Household" },
                { id: 7, name: "Social" },
                { id: 8, name: "Health" },
            ].map((c) => ({ ...c, icon: suggestIconForName?.(c.name) }));
        } catch (e) {
            console.warn("Trends: failed to generate web fallback categories with icons", e);
            categories = [
                { id: 1, name: "Exercise" },
                { id: 2, name: "Meals" },
                { id: 3, name: "Work" },
                { id: 4, name: "Learning" },
                { id: 5, name: "Entertainment" },
                { id: 6, name: "Household" },
                { id: 7, name: "Social" },
                { id: 8, name: "Health" },
            ];
        }
    }

    const today = computeTrends(activities, categories, "today");
    const week = computeTrends(activities, categories, "week");
    const month = computeTrends(activities, categories, "month");

    // Compute previous periods for comparison
    const yesterday = computeTrends(activities, categories, "yesterday");
    const lastWeek = computeTrends(activities, categories, "lastWeek");
    const lastMonth = computeTrends(activities, categories, "lastMonth");

    // Filter today's activities for detailed AI summary
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayActivities = activities.filter((activity) => {
        const activityDate = parseTimestampToDate(activity.timestamp);
        return activityDate >= startOfToday;
    });

    // Check cache for AI summaries
    const cacheKey = "aiSummariesCache";
    const cached = typeof localStorage !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.summaries && parsed.timestamp) {
                const { summaries, timestamp } = parsed;
                const nowTs = Date.now();
                if (nowTs - timestamp < 10 * 60 * 1000) {
                    return {
                        today,
                        week,
                        month,
                        aiToday: summaries.today || "",
                        aiWeek: summaries.week || "",
                        aiMonth: summaries.month || "",
                    };
                }
            }
        } catch (error) {
            console.warn("Invalid cache data, regenerating summaries:", error);
            try {
                localStorage.removeItem(cacheKey);
            } catch (e) {
                console.warn("Failed to remove invalid cache:", e);
            }
        }
    }

    // 🔥 Generate AI summaries
    const todayPrompt = TODAY_SUMMARY_PROMPT(
        todayActivities,
        categories,
        yesterday.length > 0 ? yesterday : undefined
    );
    const weekPrompt = TREND_SUMMARY_PROMPT(
        "this week",
        week,
        lastWeek.length > 0 ? lastWeek : undefined
    );
    const monthPrompt = TREND_SUMMARY_PROMPT(
        "this month",
        month,
        lastMonth.length > 0 ? lastMonth : undefined
    );

    const todayRes = await callModel(todayPrompt, [], []);
    const weekRes = await callModel(weekPrompt, [], []);
    const monthRes = await callModel(monthPrompt, [], []);

    const summaries = {
        today: todayRes.content,
        week: weekRes.content,
        month: monthRes.content,
        timestamp: Date.now(),
    };
    try {
        localStorage.setItem(cacheKey, JSON.stringify(summaries));
    } catch (e) {
        console.warn("Failed to write summaries to cache:", e);
    }

    return {
        today,
        week,
        month,
        aiToday: todayRes.content,
        aiWeek: weekRes.content,
        aiMonth: monthRes.content,
    };
}

export function computeTrends(
    activities: {
        category_id?: number;
        timestamp: string;
        length_mins?: number;
        category?: string;
        sub_category?: string;
    }[],
    categories: CategoryItem[],
    period:
        | "today"
        | "yesterday"
        | "week"
        | "lastWeek"
        | "month"
        | "lastMonth"
): TrendDataCategory[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date | null = null;
    switch (period) {
        case "today":
            startDate = today;
            break;
        case "yesterday":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            endDate = new Date(today);
            break;
        case "week":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
        case "lastWeek":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 14);
            endDate = new Date(today);
            endDate.setDate(today.getDate() - 7);
            break;
        case "month":
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
        case "lastMonth":
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 2);
            endDate = new Date(today);
            endDate.setMonth(today.getMonth() - 1);
            break;
    }

    const filteredActivities = activities.filter((activity) => {
        const activityDate = parseTimestampToDate(activity.timestamp);
        const afterStart = activityDate >= startDate;
        const beforeEnd = endDate ? activityDate < endDate : true;
        return afterStart && beforeEnd;
    });

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const categoryData: {
        [category: string]: { total: number; subs: { [sub: string]: number }; daily: number[] };
    } = {};
    // Prepare 7-day buckets starting at startDate (last 7 days window)
    const dayBuckets: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        d.setHours(0, 0, 0, 0);
        dayBuckets.push(d);
    }
    filteredActivities.forEach((activity) => {
        const categoryName = activity.category_id
            ? categories.find((c) => c.id === activity.category_id)?.name ||
            "Uncategorized"
            : activity.category || "Uncategorized";
        const subName = activity.sub_category || "General";

        if (!categoryData[categoryName]) {
            categoryData[categoryName] = { total: 0, subs: {}, daily: Array(7).fill(0) };
        }
        const mins = activity.length_mins || 0;
        categoryData[categoryName].total += mins;
        categoryData[categoryName].subs[subName] =
            (categoryData[categoryName].subs[subName] || 0) + mins;

        // Compute day index relative to startDate and add to daily bucket if in range
        try {
            const activityDate = parseTimestampToDate(activity.timestamp);
            const diff = Math.floor((activityDate.setHours(0, 0, 0, 0) - dayBuckets[0].getTime()) / MS_PER_DAY);
            const idx = Math.max(0, Math.min(6, diff));
            if (!Number.isNaN(idx)) {
                categoryData[categoryName].daily[idx] += mins;
            }
        } catch (e) {
            // ignore parsing errors
            console.warn("Failed to parse activity date for daily trend:", e);
        }
    });

    const totalAll = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
    const trends: TrendDataCategory[] = Object.entries(categoryData)
        .map(([category, data]) => {
            const subcategories = Object.entries(data.subs)
                .map(([name, totalMinutes]) => ({
                    name,
                    totalMinutes,
                    percentage: data.total > 0 ? Math.round((totalMinutes / data.total) * 100) : 0,
                }))
                .sort((a, b) => b.totalMinutes - a.totalMinutes);
            // find icon for this category from categories list or suggest
            const catObj = categories.find((c) => c.name === category);
            const iconKey = catObj?.icon || (category ? suggestIconForName(category) : undefined);
            const daily = data.daily
                ? data.daily.map((minutes, i) => ({
                    day: dayBuckets[i].toLocaleDateString(undefined, { weekday: "short" }),
                    minutes,
                }))
                : undefined;

            return {
                category,
                icon: iconKey,
                totalMinutes: data.total,
                percentage: totalAll > 0 ? Math.round((data.total / totalAll) * 100) : 0,
                subcategories,
                daily,
            };
        })
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

    return trends;
}

export default computeTrends;
