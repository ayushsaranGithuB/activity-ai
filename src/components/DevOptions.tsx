import React from "react";
import { storage } from "../lib/storage";
import { testDatabase } from "../test-db";

export default function DevOptions() {
  const runDatabaseTest = async () => {
    console.clear();
    await testDatabase();
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
      alert("All data cleared!");
      // Optionally reload the page to refresh all components
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear data:", err);
      alert("Failed to clear data");
    }
  };

  return (
    <div className="devOptions">
      <button onClick={runDatabaseTest} style={{ fontSize: "12px" }}>
        🧪 Test Database
      </button>
      <button
        onClick={clearAllData}
        style={{ fontSize: "12px", background: "#dc3545", color: "white" }}
      >
        🗑️ Clear All Data
      </button>
    </div>
  );
}
