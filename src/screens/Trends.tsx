import React, { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Activity } from "lucide-react";
import { TREND_SUMMARY_PROMPT } from "@/prompts/trendSummaryPrompt";
import { callModel } from "@/agent/model";
import Spinner from "@/components/ui/spinner";

interface TrendData {
  category: string;
  totalMinutes: number;
  percentage: number;
  subcategories: { name: string; totalMinutes: number; percentage: number }[];
}

const TrendCard = ({
  title,
  trends,
  icon: Icon,
  color,
}: {
  title: string;
  trends: TrendData[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span>{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {trends.length > 0 ? (
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 w-full">
                  <span className="font-medium">{trend.category}</span>
                </div>
                <div
                  className={`h-[2px] rounded-md bg-white/30`}
                  style={{ width: `${trend.percentage}%` }}
                />
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
                    {trend.totalMinutes} min
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {trend.percentage}%
                  </span>
                </div>
              </div>
              {trend.subcategories.map((sub) => (
                <div
                  key={sub.name}
                  className="flex items-center justify-between ml-4 opacity-60 mb-0"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-xs text-muted-foreground">
                      {sub.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 min-w-[120px]">
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                      {sub.totalMinutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activities in this period</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const Trends: React.FC = () => {
  const [todayTrends, setTodayTrends] = useState<TrendData[]>([]);
  const [weekTrends, setWeekTrends] = useState<TrendData[]>([]);
  const [monthTrends, setMonthTrends] = useState<TrendData[]>([]);

  // ✨ NEW: AI summaries
  const [aiToday, setAiToday] = useState("");
  const [aiWeek, setAiWeek] = useState("");
  const [aiMonth, setAiMonth] = useState("");

  const [loading, setLoading] = useState(true);

  const computeTrends = useCallback(
    (
      activities: {
        category_id?: number;
        timestamp: string;
        length_mins?: number;
        category?: string;
        sub_category?: string;
      }[],
      categories: { id: number; name: string }[],
      period:
        | "today"
        | "yesterday"
        | "week"
        | "lastWeek"
        | "month"
        | "lastMonth"
    ): TrendData[] => {
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
        const activityDate = new Date(activity.timestamp);
        const afterStart = activityDate >= startDate;
        const beforeEnd = endDate ? activityDate < endDate : true;
        return afterStart && beforeEnd;
      });

      const categoryData: {
        [category: string]: { total: number; subs: { [sub: string]: number } };
      } = {};
      filteredActivities.forEach((activity) => {
        const categoryName = activity.category_id
          ? categories.find((c) => c.id === activity.category_id)?.name ||
            "Uncategorized"
          : activity.category || "Uncategorized";
        const subName = activity.sub_category || "General";

        if (!categoryData[categoryName]) {
          categoryData[categoryName] = { total: 0, subs: {} };
        }
        categoryData[categoryName].total += activity.length_mins || 0;
        categoryData[categoryName].subs[subName] =
          (categoryData[categoryName].subs[subName] || 0) +
          (activity.length_mins || 0);
      });

      const totalAll = Object.values(categoryData).reduce(
        (sum, cat) => sum + cat.total,
        0
      );
      const trends: TrendData[] = Object.entries(categoryData)
        .map(([category, data]) => {
          const subcategories = Object.entries(data.subs)
            .map(([name, totalMinutes]) => ({
              name,
              totalMinutes,
              percentage:
                data.total > 0
                  ? Math.round((totalMinutes / data.total) * 100)
                  : 0,
            }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes);
          return {
            category,
            totalMinutes: data.total,
            percentage:
              totalAll > 0 ? Math.round((data.total / totalAll) * 100) : 0,
            subcategories,
          };
        })
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      return trends;
    },
    []
  );

  useEffect(() => {
    async function loadTrends() {
      setLoading(true);
      try {
        let activities = [];
        let categories = [];

        if (Capacitor.isNativePlatform()) {
          const tools = await import("@/agent/tools");

          activities =
            (await tools.dbQuery(
              "SELECT id, description, category_id, length_mins, timestamp, sub_category FROM activities ORDER BY timestamp DESC"
            )) || [];

          categories =
            (await tools.dbQuery(
              "SELECT id, name FROM categories ORDER BY id ASC"
            )) || [];
        } else {
          activities = (
            await import("@/components/dummyData/sample-activities")
          ).sample_activities;

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

        const today = computeTrends(activities, categories, "today");
        const week = computeTrends(activities, categories, "week");
        const month = computeTrends(activities, categories, "month");

        // Compute previous periods for comparison
        const yesterday = computeTrends(activities, categories, "yesterday");
        const lastWeek = computeTrends(activities, categories, "lastWeek");
        const lastMonth = computeTrends(activities, categories, "lastMonth");

        // Filter today's activities for detailed AI summary
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const todayActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= startOfToday;
        });

        setTodayTrends(today);
        setWeekTrends(week);
        setMonthTrends(month);

        // Check cache for AI summaries
        const cacheKey = "aiSummariesCache";
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.summaries && parsed.timestamp) {
              const { summaries, timestamp } = parsed;
              const now = Date.now();
              if (now - timestamp < 10 * 60 * 1000) {
                // 10 minutes
                setAiToday(summaries.today || "");
                setAiWeek(summaries.week || "");
                setAiMonth(summaries.month || "");
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.warn("Invalid cache data, regenerating summaries:", error);
            localStorage.removeItem(cacheKey); // Clear invalid cache
          }
        }

        // 🔥 Generate AI summaries
        const todayPrompt = `You are Activity AI, an agent that summarizes a user's activity patterns in clear, friendly language.

Your task: Provide a short, helpful natural-language summary of the user's activity for the period: **today**.

Activity Data:
${
  todayActivities.length > 0
    ? todayActivities
        .map((activity) => {
          const categoryName = activity.category_id
            ? categories.find((c) => c.id === activity.category_id)?.name ||
              "Uncategorized"
            : activity.category || "Uncategorized";
          return `- ${activity.description || "Activity"}: ${categoryName} > ${
            activity.sub_category || "General"
          }, ${activity.length_mins || 0} minutes`;
        })
        .join("\n")
    : "- No activities recorded."
}
${
  yesterday.length > 0
    ? `

Yesterday's Activity Data (for comparison):
${yesterday
  .map((t) => `- ${t.category}: ${t.totalMinutes} minutes (${t.percentage}%)`)
  .join("\n")}`
    : ""
}

Guidelines:
- Write a concise summary (1–3 sentences).
- Tone: friendly, supportive, human.
- Highlight the most active category if one clearly dominates.
- If activity is spread out, mention the balance.
- If there is no data, respond with an encouraging message.
- If yesterday's data is available, compare and contrast with today (e.g., more/less time in certain categories).
- Do NOT restate raw numbers verbatim unless meaningful.
- Focus on trends, not exact percentages.
- Avoid bullet points in your answer.
- Write as a single paragraph.
- No formatting like **bold**, no lists, no JSON.
- Return ONLY the final summary sentence(s).`;
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
        localStorage.setItem(cacheKey, JSON.stringify(summaries));

        setAiToday(todayRes.content);
        setAiWeek(weekRes.content);
        setAiMonth(monthRes.content);
      } catch (err) {
        console.error("Failed to load trends:", err);
      }
      setLoading(false);
    }

    loadTrends();
  }, [computeTrends]);

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Trends</h1>
        <p className="text-muted-foreground">See how you spend your time</p>
      </div>

      {/* FALLBACK IF NO DATA */}
      {todayTrends.length === 0 &&
        weekTrends.length === 0 &&
        monthTrends.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start logging activities to see your trends!
            </p>
          </div>
        )}

      <div className="flex flex-col gap-6 ">
        <TrendCard
          title="Today"
          trends={todayTrends}
          icon={Calendar}
          color="text-blue-500"
        />

        {/* 🔮 AI SUMMARY — TODAY */}
        {aiToday && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              AI Summary — Today
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {aiToday}
            </p>
          </div>
        )}

        <TrendCard
          title="This Week"
          trends={weekTrends}
          icon={TrendingUp}
          color="text-green-500"
        />

        {/* 🔮 AI SUMMARY — WEEK */}
        {aiWeek && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100">
              AI Summary — This Week
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {aiWeek}
            </p>
          </div>
        )}
        <TrendCard
          title="This Month"
          trends={monthTrends}
          icon={Activity}
          color="text-purple-500"
        />

        {/* 🔮 AI SUMMARY — MONTH */}
        {aiMonth && (
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              AI Summary — This Month
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              {aiMonth}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trends;
