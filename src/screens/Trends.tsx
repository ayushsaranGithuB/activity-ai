import React, { useState, useEffect } from "react";
import { TrendingUp, Calendar, Activity } from "lucide-react";
import { loadTrends } from "@/utils/trends";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavBar from "@/components/ui/BottomNavBar";
import TrendCard from "@/components/ui/TrendsCard";
import { TrendDataCategory } from "@/types";

const Trends: React.FC = () => {
  const [todayTrends, setTodayTrends] = useState<TrendDataCategory[]>([]);
  const [weekTrends, setWeekTrends] = useState<TrendDataCategory[]>([]);
  const [monthTrends, setMonthTrends] = useState<TrendDataCategory[]>([]);

  // ✨ NEW: AI summaries
  const [aiToday, setAiToday] = useState("");
  const [aiWeek, setAiWeek] = useState("");
  const [aiMonth, setAiMonth] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // setLoading(true);
    loadTrends()
      .then((res) => {
        setTodayTrends(res.today);
        setWeekTrends(res.week);
        setMonthTrends(res.month);
        setAiToday(res.aiToday);
        setAiWeek(res.aiWeek);
        setAiMonth(res.aiMonth);
      })
      .catch((err) => console.error("Failed to load trends:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-10 space-y-1 flex items-center justify-center flex-col">
        {/* <Spinner /> */}
        <img src="/logo-animated.svg" alt="" width={200} />
        <h2 className="text-xl font-bold animate-pulse">Computing trends...</h2>
      </div>
    );
  }

  return (
    <>
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

        <Tabs defaultValue="today">
          <TabsList className="gap-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <TrendCard
              title="Today"
              trends={todayTrends}
              icon={Calendar}
              color="text-blue-500"
              period="day"
            />

            {/* 🔮 AI SUMMARY — TODAY */}
            {aiToday && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mt-5">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  vs Yesterday
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {aiToday}
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="week">
            <TrendCard
              title="This Week"
              trends={weekTrends}
              icon={TrendingUp}
              color="text-green-500"
              period="week"
            />
            {/* 🔮 AI SUMMARY — WEEK */}
            {aiWeek && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 mt-5">
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  AI Summary — This Week
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {aiWeek}
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="month">
            <TrendCard
              title="This Month"
              trends={monthTrends}
              icon={Activity}
              color="text-purple-500"
              period="month"
            />

            {/* 🔮 AI SUMMARY — MONTH */}
            {aiMonth && (
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 mt-5">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  AI Summary — This Month
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {aiMonth}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavBar activePath="/trends" />
    </>
  );
};

export default Trends;
