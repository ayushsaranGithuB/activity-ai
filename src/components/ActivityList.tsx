import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import type { Activity } from "../types";
import "../css/activity.css";
import { Filter, Search, Trash } from "lucide-react";

interface ActivityListProps {
  initialCategory?: string | null;
  initialDateRange?: { start: number; end: number } | null;
}

export default function ActivityList({
  initialCategory,
  initialDateRange,
}: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || "all"
  );
  const [dateRange, setDateRange] = useState<{
    start: number;
    end: number;
  } | null>(initialDateRange || null);
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  //   States for search and filter
  const [searchVisible, setSearchVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(
    !!initialCategory || !!initialDateRange
  );

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

  // Filter activities based on search and category
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      activity.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || activity.category === selectedCategory;

    const matchesDateRange =
      !dateRange ||
      (activity.createdAt >= dateRange.start &&
        activity.createdAt <= dateRange.end);

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDayHeader = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Group activities by day
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const dayKey = new Date(activity.createdAt).toDateString();
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="activity-section">
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="activity-header">
        <h2>Activity Log ({activities.length} total)</h2>
        <button onClick={() => setSearchVisible(!searchVisible)}>
          <Search size={16} />
        </button>
        <button onClick={() => setFilterVisible(!filterVisible)}>
          <Filter size={16} />
        </button>
      </div>

      {dateRange && (
        <div
          style={{
            padding: "8px 10px",
            background: "#e8f5f1",
            borderRadius: "6px",
            fontSize: "14px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            📅 Showing: {new Date(dateRange.start).toLocaleDateString()} -{" "}
            {new Date(dateRange.end).toLocaleDateString()}
          </span>
          <button
            onClick={() => {
              setDateRange(null);
              setSelectedCategory("all");
            }}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="filters">
        {searchVisible && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            style={{ flex: "1", minWidth: "200px" }}
          />
        )}

        {filterVisible && (
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
        )}
      </div>

      {loading ? (
        <p>Loading activities...</p>
      ) : (
        <div className="activities-list">
          {filteredActivities.length === 0 && (
            <p style={{ color: "#666", fontStyle: "italic" }}>
              {activities.length === 0
                ? "No activities yet. Add your first activity above!"
                : "No activities match your search."}
            </p>
          )}
          {Object.keys(groupedActivities).map((dayKey) => {
            const dayActivities = groupedActivities[dayKey];
            const firstActivity = dayActivities[0];

            return (
              <div key={dayKey} className="day-group">
                <h3 className="day-header">
                  {formatDayHeader(firstActivity.createdAt)}
                </h3>
                <div className="day-divider"></div>
                {dayActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-row">
                      <span className="activity-time">
                        {formatDate(activity.createdAt)}
                      </span>
                      <span className="activity-separator">-</span>
                      <span className="activity-text">{activity.text}</span>
                    </div>
                    <div className="activity-actions">
                      <span className="activity-category">
                        {activity.category}
                      </span>
                      <button
                        className="activity-delete"
                        onClick={() => deleteActivity(activity.id)}
                        title="Delete activity"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
