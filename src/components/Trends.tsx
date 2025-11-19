import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { calculateCategoryTrends, generateTrendSummary } from "../lib/trends";
import type { Activity, CategoryTrend } from "../types";

export default function Trends() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trends, setTrends] = useState<CategoryTrend[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  useEffect(() => {
    loadData();
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
      <h2>Trends</h2>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setPeriod("week")}
          style={{
            marginRight: "10px",
            background: period === "week" ? "#007bff" : "#eee",
            color: period === "week" ? "white" : "black",
          }}
        >
          Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          style={{
            marginRight: "10px",
            background: period === "month" ? "#007bff" : "#eee",
            color: period === "month" ? "white" : "black",
          }}
        >
          Month
        </button>
        <button
          onClick={() => setPeriod("year")}
          style={{
            background: period === "year" ? "#007bff" : "#eee",
            color: period === "year" ? "white" : "black",
          }}
        >
          Year
        </button>
      </div>

      <div className="success" style={{ marginBottom: "20px" }}>
        {summary}
      </div>

      <div>
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
