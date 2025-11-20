import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import type { BroadCategory } from "../types";
import {
  calculateCategoryTrends,
  generateTrendSummary,
  getPeriodRange,
} from "../lib/trends";
import type { Activity, CategoryTrend, Category } from "../types";
import "../css/trends.css";

// Helper function to get period range with offset
function getOffsetPeriodRange(
  period: "week" | "month" | "year",
  offset: number
): { start: number; end: number } {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (period === "week") {
    // Week starts on Sunday
    const dayOfWeek = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek + offset * 7);
    start.setHours(0, 0, 0, 0);

    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    start.setHours(0, 0, 0, 0);

    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    // year
    start = new Date(now.getFullYear() + offset, 0, 1);
    start.setHours(0, 0, 0, 0);

    end = new Date(now.getFullYear() + offset, 11, 31);
    end.setHours(23, 59, 59, 999);
  }

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

// Helper function to format date range label
function formatPeriodLabel(
  period: "week" | "month" | "year",
  offset: number
): string {
  const range = getOffsetPeriodRange(period, offset);
  const start = new Date(range.start);
  const end = new Date(range.end);

  if (offset === 0) {
    if (period === "week") return "This Week";
    if (period === "month") return "This Month";
    if (period === "year") return "This Year";
  }

  if (period === "week") {
    const monthStart = start.toLocaleDateString("en-US", { month: "short" });
    const monthEnd = end.toLocaleDateString("en-US", { month: "short" });
    const dateStart = start.getDate();
    const dateEnd = end.getDate();

    if (monthStart === monthEnd) {
      return `${monthStart} ${dateStart}-${dateEnd}`;
    } else {
      return `${monthStart} ${dateStart} - ${monthEnd} ${dateEnd}`;
    }
  } else if (period === "month") {
    return start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } else {
    return start.getFullYear().toString();
  }
}

const PieChart = ({
  trends,
  onCategoryClick,
}: {
  trends: CategoryTrend[];
  onCategoryClick?: (category: string) => void;
}) => {
  const colors = [
    "#4db59a",
    "#12aedeff",
    "#b97dd3ff",
    "#9bddd2",
    "#b9e7e4",
    "#ffa726",
    "#66bb6a",
    "#ab47bc",
    "#ec407a",
    "#5c6bc0",
  ];

  const total = trends.reduce((sum, trend) => sum + trend.activityCount, 0);
  if (total === 0) return null;

  let currentAngle = -90; // Start at top
  const paths = trends.map((trend, index) => {
    const percentage = (trend.activityCount / total) * 100;
    const angle = (percentage / 100) * 360;

    const startX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
    const startY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

    currentAngle += angle;

    const endX = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
    const endY = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M 50,50 L ${startX},${startY} A 40,40 0 ${largeArc},1 ${endX},${endY} Z`;

    return {
      path,
      color: colors[index % colors.length],
      category: trend.category,
      percentage: Math.round(percentage),
    };
  });

  return (
    <div className="trends-pie-chart">
      <svg width="300" height="300" viewBox="0 0 100 100">
        {paths.map((item, index) => (
          <path
            key={index}
            d={item.path}
            fill={item.color}
            stroke="#fff"
            strokeWidth="0.5"
          />
        ))}
      </svg>
      <div className="legend-color-box">
        {paths.map((item, index) => (
          <div
            className={`legend-item ${!onCategoryClick ? "non-clickable" : ""}`}
            key={index}
            onClick={() => onCategoryClick?.(item.category)}
          >
            <div className="legend-color" style={{ background: item.color }} />
            <span>
              {item.category} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [expandedBroad, setExpandedBroad] = useState<Set<string>>(new Set());
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, -1 = previous, 1 = next

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
      setCategories(allCategories);

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
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setLoading(false);
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

  const summary = generateTrendSummary(trends);

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

      {period === "week" && sortedBroadCategories.length > 0 && (
        <PieChart
          trends={sortedBroadCategories.map(([broadCategory, group]) => ({
            category: broadCategory,
            broadCategory: broadCategory as BroadCategory,
            totalMinutes: group.totalMinutes,
            activityCount: group.totalActivities,
          }))}
          onCategoryClick={(broad) => toggleBroadCategory(broad)}
        />
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
