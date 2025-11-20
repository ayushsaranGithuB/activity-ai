import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import {
  calculateCategoryTrends,
  generateTrendSummary,
  getPeriodRange,
} from "../lib/trends";
import type { Activity, CategoryTrend } from "../types";
import "../css/trends.css";

const PieChart = ({
  trends,
  onCategoryClick,
}: {
  trends: CategoryTrend[];
  onCategoryClick?: (category: string) => void;
}) => {
  const colors = [
    "#4db59a",
    "#5fc9ae",
    "#7dd3c0",
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginTop: "20px",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 100 100">
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontSize: "12px",
        }}
      >
        {paths.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: onCategoryClick ? "pointer" : "default",
              padding: "2px 4px",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
            onClick={() => onCategoryClick?.(item.category)}
            onMouseEnter={(e) => {
              if (onCategoryClick) e.currentTarget.style.background = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                background: item.color,
                borderRadius: "2px",
              }}
            />
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
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      await storage.init();
      const allActivities = await storage.getAllActivities();
      setActivities(allActivities);

      const periodTrends = calculateCategoryTrends(allActivities, period);
      setTrends(periodTrends);
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
      const dateRange = getPeriodRange(period);
      onCategoryClick(category, dateRange);
    }
  };

  return (
    <div className="trends">
      <div className="activity-header">
        <h2>Trends</h2>
        <button
          onClick={() => setPeriod("week")}
          className={period === "week" ? "active" : ""}
        >
          Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={period === "month" ? "active" : ""}
        >
          Month
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={period === "year" ? "active" : ""}
        >
          Year
        </button>
      </div>

      <div className="trend-summary" style={{ marginTop: "20px" }}>
        {trends.map((trend) => (
          <div
            key={trend.category}
            className="trend-item"
            onClick={() => handleCategoryClick(trend.category)}
            style={{
              cursor: onCategoryClick ? "pointer" : "default",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (onCategoryClick) {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div>
              <div className="name">{trend.category}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {trend.activityCount} activities • {trend.totalMinutes} min
                {trend.percentageOfTotal &&
                  ` • ${Math.round(trend.percentageOfTotal)}% of total`}
              </div>
            </div>
            <div className="count">{trend.activityCount}</div>
          </div>
        ))}
      </div>

      {period === "week" && trends.length > 0 && (
        <PieChart trends={trends} onCategoryClick={handleCategoryClick} />
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f5f5f5",
          borderRadius: "6px",
        }}
      >
        <strong>Total activities:</strong> {activities.length}
      </div>
    </div>
  );
}
