import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { testDatabase } from "../test-db";
import type { Activity } from "../types";

export default function ActivityList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize and load data
  useEffect(() => {
    const init = async () => {
      try {
        await storage.init();
        await loadActivities();
        const categories = await storage.getCategoryNames();
        setExistingCategories(categories);
      } catch (err) {
        console.error("Failed to initialize:", err);
      }
    };
    init();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const allActivities = await storage.getAllActivities();
      // Sort by most recent first
      allActivities.sort((a, b) => b.createdAt - a.createdAt);
      setActivities(allActivities);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      await storage.deleteActivity(id);
      await loadActivities();
      setSuccess("Activity deleted!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Failed to delete activity:", err);
      setError("Failed to delete activity");
    }
  };

  const runDatabaseTest = async () => {
    console.clear();
    await testDatabase();
    await loadActivities();
    const categories = await storage.getCategoryNames();
    setExistingCategories(categories);
    alert("Database test completed! Check the console for details.");
  };

  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This cannot be undone!"
      )
    )
      return;

    try {
      await storage.clearAllData();
      setActivities([]);
      setExistingCategories([]);
      setSuccess("All data cleared!");
    } catch (err) {
      console.error("Failed to clear data:", err);
      setError("Failed to clear data");
    }
  };

  // Filter activities based on search and category
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      activity.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || activity.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="activity-list">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div
        className="test-buttons"
        style={{ marginBottom: "20px", display: "flex", gap: "10px" }}
      >
        <button onClick={runDatabaseTest} style={{ fontSize: "12px" }}>
          🧪 Test Database
        </button>
        <button
          onClick={clearAllData}
          style={{ fontSize: "12px", background: "#dc3545" }}
        >
          🗑️ Clear All Data
        </button>
      </div>

      <h3>Activity Log ({activities.length} total)</h3>

      <div
        className="filters"
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search activities..."
          style={{ flex: "1", minWidth: "200px" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="all">All Categories</option>
          {existingCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading activities...</p>
      ) : filteredActivities.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          {activities.length === 0
            ? "No activities yet. Add your first activity above!"
            : "No activities match your search."}
        </p>
      ) : (
        <div className="activities-list">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="activity-item"
              style={{
                padding: "15px",
                marginBottom: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "#f9f9f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {activity.text}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  <span
                    style={{
                      background: "#007bff",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      marginRight: "10px",
                    }}
                  >
                    {activity.category}
                  </span>
                  <span>{formatDate(activity.createdAt)}</span>
                  <span style={{ marginLeft: "10px", color: "#999" }}>
                    ID: {activity.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteActivity(activity.id)}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
