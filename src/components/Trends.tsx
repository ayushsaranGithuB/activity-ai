import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { calculateCategoryTrends, generateTrendSummary } from "../lib/trends";
import type { Activity, CategoryTrend } from "../types";
import "../css/trends.css";

export default function Trends() {
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
          <div key={trend.category} className="trend-item">
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
