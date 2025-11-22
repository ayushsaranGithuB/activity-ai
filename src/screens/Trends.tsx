import React, { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Activity } from "lucide-react";

interface TrendData {
  category: string;
  count: number;
  percentage: number;
}

const Trends: React.FC = () => {
  const [todayTrends, setTodayTrends] = useState<TrendData[]>([]);
  const [weekTrends, setWeekTrends] = useState<TrendData[]>([]);
  const [monthTrends, setMonthTrends] = useState<TrendData[]>([]);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = () => {
    if (Capacitor.isNativePlatform()) {
      // TODO: Load from SQLite with proper trend computation
      setTodayTrends([]);
      setWeekTrends([]);
      setMonthTrends([]);
    } else {
      // Load from localStorage and compute trends
      const activities = JSON.parse(localStorage.getItem("activities") || "[]");
      const categories = JSON.parse(localStorage.getItem("categories") || "[]");

      setTodayTrends(computeTrends(activities, categories, "today"));
      setWeekTrends(computeTrends(activities, categories, "week"));
      setMonthTrends(computeTrends(activities, categories, "month"));
    }
  };

  const computeTrends = (
    activities: any[],
    categories: any[],
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

    // Filter activities by date
    const filteredActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate;
    });

    // Count by category
    const categoryCounts: { [key: string]: number } = {};
    filteredActivities.forEach((activity) => {
      const categoryName = activity.category_id
        ? categories.find((c: any) => c.id === activity.category_id)?.name ||
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
  };

  const TrendCard = ({
    title,
    trends,
    icon: Icon,
    color,
  }: {
    title: string;
    trends: TrendData[];
    icon: any;
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
            {trends.slice(0, 5).map((trend, index) => (
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
            <p className="text-muted-foreground">
              No activities in this period
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
            {todayTrends.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Today's Focus
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You've been most active in{" "}
                  <strong>{todayTrends[0].category}</strong> today (
                  {todayTrends[0].percentage}% of your activities).
                </p>
              </div>
            )}

            {weekTrends.length > 0 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Weekly Pattern
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  This week, <strong>{weekTrends[0].category}</strong> has been
                  your primary focus ({weekTrends[0].percentage}% of your
                  activities).
                </p>
              </div>
            )}

            {monthTrends.length > 0 && (
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  Monthly Overview
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Over the past month, you've logged{" "}
                  {monthTrends.reduce((sum, trend) => sum + trend.count, 0)}{" "}
                  activities across {monthTrends.length} categories.
                </p>
              </div>
            )}

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
