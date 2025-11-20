import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import type { BroadCategory } from "../types";
import { calculateCategoryTrends } from "../lib/trends";
import type { Activity, CategoryTrend } from "../types";
import { getOffsetPeriodRange, formatPeriodLabel } from "../lib/date-utils";
import PieChart from "./charts/PieChart";
import BarChart from "./charts/BarChart";
import "../css/trends.css";

interface TrendsProps {
  onCategoryClick?: (
    category: string,
    dateRange: { start: number; end: number }
  ) => void;
}

export default function Trends({ onCategoryClick }: TrendsProps) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trends, setTrends] = useState<CategoryTrend[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [expandedBroad, setExpandedBroad] = useState<Set<string>>(new Set());
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, -1 = previous, 1 = next
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, periodOffset]);

  // Expand all broad categories by default when trends load
  useEffect(() => {
    if (trends.length > 0) {
      const allBroadCategories = new Set(
        trends.map((t) => t.broadCategory || "Other")
      );
      setExpandedBroad(allBroadCategories);
    }
  }, [trends]);

  const loadData = async () => {
    setLoading(true);
    try {
      await storage.init();
      const allActivities = await storage.getAllActivities();
      const allCategories = await storage.getAllCategories();

      setActivities(allActivities);

      // Get the date range for the current period + offset
      const range = getOffsetPeriodRange(period, periodOffset);

      // Filter activities to the date range
      const filteredActivities = allActivities.filter(
        (a) => a.createdAt >= range.start && a.createdAt <= range.end
      );

      const periodTrends = calculateCategoryTrends(filteredActivities, period);

      // Enrich trends with broad category information
      const enrichedTrends = periodTrends.map((trend) => {
        const category = allCategories.find((c) => c.name === trend.category);
        return {
          ...trend,
          broadCategory: category?.broadCategory || "Other",
        };
      });

      setTrends(enrichedTrends);

      // Generate AI summary if we have activities in this period
      if (filteredActivities.length > 0) {
        generateAISummary(filteredActivities, enrichedTrends);
      } else {
        setAiSummary("");
      }
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (
    filteredActivities: Activity[],
    enrichedTrends: CategoryTrend[]
  ) => {
    setSummaryLoading(true);
    try {
      const response = await fetch("/api/trends-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
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
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to generate AI summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Trends</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div>
        <h2>Trends</h2>
        <p>No activities logged yet. Start logging to see your trends!</p>
      </div>
    );
  }

  const handleCategoryClick = (category: string) => {
    if (onCategoryClick) {
      const dateRange = getOffsetPeriodRange(period, periodOffset);
      onCategoryClick(category, dateRange);
    }
  };

  // Group trends by broad category
  interface BroadCategoryGroup {
    subcategories: CategoryTrend[];
    totalActivities: number;
    totalMinutes: number;
  }

  const groupedTrends = trends.reduce((acc, trend) => {
    const broad = trend.broadCategory || "Other";
    if (!acc[broad]) {
      acc[broad] = {
        subcategories: [],
        totalActivities: 0,
        totalMinutes: 0,
      };
    }
    acc[broad].subcategories.push(trend);
    acc[broad].totalActivities += trend.activityCount;
    acc[broad].totalMinutes += trend.totalMinutes;
    return acc;
  }, {} as Record<string, BroadCategoryGroup>);

  // Sort broad categories by total activities
  const sortedBroadCategories = (
    Object.entries(groupedTrends) as [string, BroadCategoryGroup][]
  ).sort(([, a], [, b]) => b.totalActivities - a.totalActivities);

  const toggleBroadCategory = (broad: string) => {
    const newExpanded = new Set(expandedBroad);
    if (newExpanded.has(broad)) {
      newExpanded.delete(broad);
    } else {
      newExpanded.add(broad);
    }
    setExpandedBroad(newExpanded);
  };

  return (
    <div className="trends">
      <div className="activity-header">
        <h2>Trends</h2>
        <div className="period-selector">
          <button
            onClick={() => {
              setPeriod("week");
              setPeriodOffset(0);
            }}
            className={period === "week" ? "active" : ""}
          >
            Week
          </button>
          <button
            onClick={() => {
              setPeriod("month");
              setPeriodOffset(0);
            }}
            className={period === "month" ? "active" : ""}
          >
            Month
          </button>
          <button
            onClick={() => {
              setPeriod("year");
              setPeriodOffset(0);
            }}
            className={period === "year" ? "active" : ""}
          >
            Year
          </button>
        </div>
      </div>

      <div className="trends-timeline-nav">
        <button onClick={() => setPeriodOffset(periodOffset - 1)}>←</button>
        <span>{formatPeriodLabel(period, periodOffset)}</span>
        <button
          onClick={() => setPeriodOffset(periodOffset + 1)}
          disabled={periodOffset >= 0}
        >
          →
        </button>
      </div>

      {/* Trends AI Summary */}
      {aiSummary && (
        <div className="ai-summary">
          <p>{aiSummary}</p>
        </div>
      )}
      {summaryLoading && (
        <div className="ai-summary loading">
          <p>Generating insights...</p>
        </div>
      )}

      <h3>Here is a breakdown of your activities by category:</h3>

      {sortedBroadCategories.length > 0 && (
        <>
          {chartType === "pie" ? (
            <PieChart
              trends={sortedBroadCategories.map(([broadCategory, group]) => ({
                category: broadCategory,
                broadCategory: broadCategory as BroadCategory,
                totalMinutes: group.totalMinutes,
                activityCount: group.totalActivities,
              }))}
              onCategoryClick={(broad) => toggleBroadCategory(broad)}
            />
          ) : (
            <BarChart
              trends={sortedBroadCategories.map(([broadCategory, group]) => ({
                category: broadCategory,
                broadCategory: broadCategory as BroadCategory,
                totalMinutes: group.totalMinutes,
                activityCount: group.totalActivities,
              }))}
              onCategoryClick={(broad) => toggleBroadCategory(broad)}
            />
          )}
          <div className="chart-type-selector slide-selector">
            <button
              onClick={() => setChartType("pie")}
              className={chartType === "pie" ? "active" : ""}
            >
              Pie Chart
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={chartType === "bar" ? "active" : ""}
            >
              Bar Chart
            </button>
          </div>
        </>
      )}
      <div className="trend-summary">
        {sortedBroadCategories.map(([broadCategory, group]) => (
          <div key={broadCategory} className="trend-group">
            {/* Broad Category Header */}
            <div
              className="trend-item broad-category"
              onClick={() => toggleBroadCategory(broadCategory)}
            >
              <div className="category-header">
                <div
                  className={
                    expandedBroad.has(broadCategory) ? "open" : "closed"
                  }
                >
                  {broadCategory}
                </div>
                <div className="trend-meta">
                  {group.totalActivities} activities • {group.totalMinutes} min
                  {" • "}
                  {group.subcategories.length}{" "}
                  {group.subcategories.length === 1
                    ? "subcategory"
                    : "subcategories"}
                </div>
              </div>
              <div className="count">{group.totalActivities}</div>
            </div>

            {/* Subcategories (collapsible) */}
            {expandedBroad.has(broadCategory) && (
              <div className="subcategories-container">
                {group.subcategories.map((trend) => (
                  <div
                    key={trend.category}
                    className={`trend-item subcategory ${
                      !onCategoryClick ? "non-clickable" : ""
                    }`}
                    onClick={() => handleCategoryClick(trend.category)}
                  >
                    <div>
                      <div className="name">{trend.category}</div>
                      <div className="trend-meta">
                        {trend.activityCount} activities • {trend.totalMinutes}{" "}
                        min
                        {trend.percentageOfTotal &&
                          ` • ${Math.round(trend.percentageOfTotal)}% of total`}
                      </div>
                    </div>
                    <div className="count">{trend.activityCount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="trends-total">
        <strong>Total activities:</strong> {activities.length}
      </div>
    </div>
  );
}
