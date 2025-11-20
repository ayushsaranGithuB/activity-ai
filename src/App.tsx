import React, { useState } from "react";
import Trends from "./components/Trends";
import Input from "./components/Input";
import ActivityList from "./components/ActivityList";
import Settings from "./components/Settings";
import { Toaster } from "react-hot-toast";
import Menu from "./components/Menu";
import { MenuIcon } from "lucide-react";

export default function App() {
  type ViewType = "home" | "input" | "trends" | "settings";

  const [view, setView] = useState<ViewType>("home");
  const [inputResetKey, setInputResetKey] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function switchView(newView: ViewType) {
    setView(newView);
    // if the view is home, reset the conversation in Input component
    if (newView === "home") {
      setInputResetKey((prev) => prev + 1);
    }
  }

  function switchToActivityList(
    category?: string,
    dateRange?: { start: number; end: number }
  ) {
    setFilterCategory(category || null);
    setFilterDateRange(dateRange || null);
    setView("input");
  }

  return (
    <div className="app">
      <Toaster position="bottom-right" />

      <header className="topbar">
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <MenuIcon size={24} />
        </button>
        <h1 className="app-title">Activity AI</h1>
      </header>

      <main className="content">
        {view === "home" && <Input resetKey={inputResetKey} />}
        {view === "input" && (
          <ActivityList
            initialCategory={filterCategory}
            initialDateRange={filterDateRange}
          />
        )}
        {view === "trends" && <Trends onCategoryClick={switchToActivityList} />}
        {view === "settings" && <Settings />}
      </main>

      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        changeView={switchView}
      />
    </div>
  );
}
