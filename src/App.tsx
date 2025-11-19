import React, { useState } from "react";
import Trends from "./components/Trends";
import Input from "./components/Input";
import ActivityList from "./components/ActivityList";
import Header from "./components/Header";
import { storage } from "./lib/storage";
import { testDatabase } from "./test-db";

export default function App() {
  type ViewType = "home" | "input" | "trends";

  const [view, setView] = useState<ViewType>("input");

  function switchView(newView: ViewType) {
    setView(newView);
  }

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
    <div className="app">
      <Header changeView={switchView} />

      <main className="content">
        {view === "home" && <Input />}
        {view === "input" && <ActivityList />}
        {view === "trends" && <Trends />}
      </main>

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
    </div>
  );
}
