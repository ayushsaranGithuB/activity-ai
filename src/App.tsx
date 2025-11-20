import React, { useState } from "react";
import Trends from "./components/Trends";
import Input from "./components/Input";
import ActivityList from "./components/ActivityList";
import Settings from "./components/Settings";
import Info from "./components/Info";
import { Toaster } from "react-hot-toast";
import Menu from "./components/Menu";
import { CircleDotDashed, MenuIcon } from "lucide-react";
import { ViewType } from "./types/views";

export default function App() {
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
        <div className="header-logo">
          <CircleDotDashed size={24} color="rgba(85, 198, 169, 1)" /> Activity
          AI
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Toggle menu"
        >
          <MenuIcon size={24} color="rgba(85, 198, 169, 1)" />
        </button>
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
        {view === "info" && <Info />}
      </main>

      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        changeView={switchView}
      />
    </div>
  );
}
