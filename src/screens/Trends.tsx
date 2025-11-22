import React, { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Activity } from "lucide-react";
import { TREND_SUMMARY_PROMPT } from "@/prompts/trendSummaryPrompt";
import { callModel } from "@/agent/model";

interface TrendData {
  category: string;
  count: number;
  percentage: number;
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
        <div className="space-y-3">
          {trends.slice(0, 5).map((trend) => (
            <div
              key={trend.category}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="font-medium">{trend.category}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
                  {trend.count}
                </span>
                <span className="text-sm text-muted-foreground">
                  {trend.percentage}%
                </span>
              </div>
            </div>
          ))}
          {trends.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{trends.length - 5} more categories
            </p>
          )}
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
      activities: { category_id?: number; timestamp: string }[],
      categories: { id: number; name: string }[],
      period: "today" | "week" | "month"
    ): TrendData[] => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate: Date;
      switch (period) {
        case "today":
          startDate = today;
          break;
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          break;
        case "month":
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
          break;
      }

      const filteredActivities = activities.filter((activity) => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate;
      });

      const categoryCounts: { [key: string]: number } = {};
      filteredActivities.forEach((activity) => {
        const categoryName = activity.category_id
          ? categories.find((c) => c.id === activity.category_id)?.name ||
            "Uncategorized"
          : "Uncategorized";
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      const total = filteredActivities.length;
      const trends: TrendData[] = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

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

          activities = await tools.dbQuery(
            "SELECT id, description, category_id, timestamp FROM activities ORDER BY timestamp DESC"
          );

          categories = await tools.dbQuery(
            "SELECT id, name FROM categories ORDER BY id ASC"
          );
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

        setTodayTrends(today);
        setWeekTrends(week);
        setMonthTrends(month);

        // 🔥 Generate AI summaries
        const todayPrompt = TREND_SUMMARY_PROMPT("today", today);
        const weekPrompt = TREND_SUMMARY_PROMPT("this week", week);
        const monthPrompt = TREND_SUMMARY_PROMPT("this month", month);

        const todayRes = await callModel(todayPrompt, [], []);
        const weekRes = await callModel(weekPrompt, [], []);
        const monthRes = await callModel(monthPrompt, [], []);

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
        <div
          role="status"
          className="mx-auto my-8 flex items-center justify-center pt-[50px]"
        >
          <svg
            aria-hidden="true"
            className=" text-neutral-tertiary animate-spin fill-brand"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={200}
            height={200}
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="#999999"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="#3EF0DB"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Trends</h1>
        <p className="text-muted-foreground">See how you spend your time</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <TrendCard
          title="Today"
          trends={todayTrends}
          icon={Calendar}
          color="text-blue-500"
        />
        <TrendCard
          title="This Week"
          trends={weekTrends}
          icon={TrendingUp}
          color="text-green-500"
        />
        <TrendCard
          title="This Month"
          trends={monthTrends}
          icon={Activity}
          color="text-purple-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trends;
