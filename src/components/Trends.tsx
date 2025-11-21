import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
// import type { BroadCategory } from "../types";
import { calculateCategoryTrends } from "../lib/trends";
import type { Activity, CategoryTrend } from "../types";
import { getOffsetPeriodRange } from "../lib/date-utils";
import PieChart from "./charts/PieChart";
import BarChart from "./charts/BarChart";
import "../css/trends.css";
import { ChartNoAxesCombined } from "lucide-react";

export default function Trends() {
  // Load all period data (today, week, month)
  const loadAllPeriodData = async () => {
    // setLoading(true); // removed, not used
    try {
      await storage.init();
      const allActs = await storage.getAllActivities();
      const allCats = await storage.getAllCategories();
      setAllActivities(allActs);

      // Today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayActs = allActs.filter(
        (a) =>
          a.createdAt >= todayStart.getTime() &&
          a.createdAt <= todayEnd.getTime()
      );
      // For today, use 'day' for trends (charts) and summary, with caching
      const todayTrends = calculateCategoryTrends(todayActs, "day").map(
        (trend) => {
          const cat = allCats.find((c) => c.name === trend.category);
          return { ...trend, broadCategory: cat?.broadCategory || "Other" };
        }
      );
      let todaySummary = "";
      if (todayActs.length > 0) {
        const cacheKey = `trends-summary-day`;
        const cached = localStorage.getItem(cacheKey);
        let cacheValid = false;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (
              parsed.timestamp &&
              parsed.summary &&
              Date.now() - parsed.timestamp < 6 * 60 * 60 * 1000
            ) {
              todaySummary = parsed.summary;
              cacheValid = true;
            }
          } catch (err) {
            console.error("Error parsing day summary cache:", err);
          }
        }
        if (!cacheValid) {
          todaySummary =
            (await generateAISummary(todayActs, todayTrends, true, "day")) ||
            "";
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ summary: todaySummary, timestamp: Date.now() })
          );
        }
      }

      // Week
      const weekRange = getOffsetPeriodRange("week", 0);
      const weekActs = allActs.filter(
        (a) => a.createdAt >= weekRange.start && a.createdAt <= weekRange.end
      );
      const weekTrends = calculateCategoryTrends(weekActs, "week").map(
        (trend) => {
          const cat = allCats.find((c) => c.name === trend.category);
          return { ...trend, broadCategory: cat?.broadCategory || "Other" };
        }
      );
      let weekSummary = "";
      if (weekActs.length > 0) {
        const cacheKey = `trends-summary-week`;
        const cache = localStorage.getItem(cacheKey);
        let cacheObj: { summary: string; timestamp: number } | null = null;
        if (cache) {
          try {
            cacheObj = JSON.parse(cache);
          } catch (err) {
            console.error("Error parsing week summary cache:", err);
          }
        }
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        if (cacheObj && now - cacheObj.timestamp < sixHours) {
          weekSummary = cacheObj.summary;
        } else {
          weekSummary =
            (await generateAISummary(weekActs, weekTrends, true, "week")) || "";
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ summary: weekSummary, timestamp: now })
          );
        }
      }

      // Month
      const monthRange = getOffsetPeriodRange("month", 0);
      const monthActs = allActs.filter(
        (a) => a.createdAt >= monthRange.start && a.createdAt <= monthRange.end
      );
      const monthTrends = calculateCategoryTrends(monthActs, "month").map(
        (trend) => {
          const cat = allCats.find((c) => c.name === trend.category);
          return { ...trend, broadCategory: cat?.broadCategory || "Other" };
        }
      );
      let monthSummary = "";
      if (monthActs.length > 0) {
        const cacheKey = `trends-summary-month`;
        const cache = localStorage.getItem(cacheKey);
        let cacheObj: { summary: string; timestamp: number } | null = null;
        if (cache) {
          try {
            cacheObj = JSON.parse(cache);
          } catch (err) {
            console.error("Error parsing month summary cache:", err);
          }
        }
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        if (cacheObj && now - cacheObj.timestamp < sixHours) {
          monthSummary = cacheObj.summary;
        } else {
          monthSummary =
            (await generateAISummary(monthActs, monthTrends, true, "month")) ||
            "";
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ summary: monthSummary, timestamp: now })
          );
        }
      }

      setPeriodData({
        today: {
          activities: todayActs,
          trends: todayTrends,
          summary: todaySummary,
        },
        week: {
          activities: weekActs,
          trends: weekTrends,
          summary: weekSummary,
        },
        month: {
          activities: monthActs,
          trends: monthTrends,
          summary: monthSummary,
        },
      });
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      // setLoading(false); // removed, not used
    }
  };
  // Helper to generate AI summary
  const generateAISummary = async (
    filteredActivities: Activity[],
    enrichedTrends: CategoryTrend[],
    returnSummary?: boolean,
    periodType?: "day" | "week" | "month"
  ) => {
    setSummaryLoadingFor(periodType || "week");
    try {
      // Use GeminiNano plugin for summary
      const data = await GeminiNano.trendsSummary({
        period: periodType || "week",
        trends: enrichedTrends.map((t) => ({
          category: t.category,
          activityCount: t.activityCount,
          totalMinutes: t.totalMinutes,
        })),
        totalActivities: filteredActivities.length,
        activities: filteredActivities.map((a) => ({
          text: a.text,
          category: a.category,
          createdAt: a.createdAt,
        })),
      });
      if (returnSummary) {
        return data.summary;
      }
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setSummaryLoadingFor(null);
    }
    return undefined;
  };
  // const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [periodData, setPeriodData] = useState<{
    today: { activities: Activity[]; trends: CategoryTrend[]; summary: string };
    week: { activities: Activity[]; trends: CategoryTrend[]; summary: string };
    month: { activities: Activity[]; trends: CategoryTrend[]; summary: string };
  }>({
    today: { activities: [], trends: [], summary: "" },
    week: { activities: [], trends: [], summary: "" },
    month: { activities: [], trends: [], summary: "" },
  });
  const [expanded, setExpanded] = useState<{
    today: boolean;
    week: boolean;
    month: boolean;
  }>({ today: false, week: false, month: false });
  const [chartType, setChartType] = useState<"pie" | "bar">("bar");
  // const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryLoadingFor, setSummaryLoadingFor] = useState<
    "day" | "week" | "month" | null
  >(null);

  useEffect(() => {
    loadAllPeriodData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (allActivities.length === 0) {
    return (
      <div>
        <h2>Trends</h2>
        <p>No activities logged yet. Start logging to see your trends!</p>
      </div>
    );
  }

  return (
    <div className="trends">
      <h2 className="trends-header">
        <ChartNoAxesCombined size={24} />
        Trends
      </h2>
      {["today", "week", "month"].map((periodKey) => {
        const label =
          periodKey === "today"
            ? "Today"
            : periodKey.charAt(0).toUpperCase() + periodKey.slice(1);
        const data = periodData[periodKey as "today" | "week" | "month"];
        const periodType = (periodKey === "today" ? "day" : periodKey) as
          | "day"
          | "week"
          | "month";
        return (
          <div key={periodKey} className="trend-period-section">
            <div className="chart-type-selector ">
              <h3>{label}</h3>

              <button
                onClick={() => setChartType("pie")}
                className={chartType === "pie" ? "active" : ""}
                disabled={summaryLoadingFor === periodType}
                title={
                  summaryLoadingFor === periodType
                    ? "Generating summary..."
                    : ""
                }
              >
                Pie Chart
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={chartType === "bar" ? "active" : ""}
                disabled={summaryLoadingFor === periodType}
                title={
                  summaryLoadingFor === periodType
                    ? "Generating summary..."
                    : ""
                }
              >
                Bar Chart
              </button>
            </div>
            {/* Always show spinner if summary is loading for this period */}
            {summaryLoadingFor === periodType ? (
              <div className="ai-summary loading">
                <div className="summary-spinner" aria-hidden />
                <p>Generating summary…</p>
              </div>
            ) : data.trends.length > 0 ? (
              <>
                {chartType === "pie" ? (
                  <PieChart trends={data.trends} />
                ) : (
                  <BarChart trends={data.trends} />
                )}
                {data.summary && (
                  <div className="ai-summary">
                    <p>{data.summary}</p>
                  </div>
                )}
                <button
                  className="expand-activities-btn"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [periodKey]: !prev[periodKey],
                    }))
                  }
                >
                  {expanded[periodKey as "today" | "week" | "month"]
                    ? "Hide Activities"
                    : "Show Activities"}
                </button>
                {expanded[periodKey as "today" | "week" | "month"] && (
                  <div className="activities-list">
                    {data.activities.length === 0 ? (
                      <p style={{ color: "#666", fontStyle: "italic" }}>
                        No activities for {label.toLowerCase()}.
                      </p>
                    ) : (
                      data.activities.map((activity) => (
                        <div key={activity.id} className="activity-item">
                          <div className="activity-row">
                            <span className="activity-time">
                              {new Date(activity.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                            <span className="activity-separator">-</span>
                            <span className="activity-text">
                              {activity.text}
                            </span>
                          </div>
                          <div className="activity-actions">
                            <span className="activity-category">
                              {activity.category}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                No data for {label.toLowerCase()}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
