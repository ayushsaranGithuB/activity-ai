import React, { useState } from "react";
import ActivityInput from "./components/ActivityInput";
import Trends from "./components/Trends";

export default function App() {
  const [view, setView] = useState<"input" | "trends">("input");

  return (
    <div className="app">
      <header className="topbar">
        <h1>Activity AI (TS)</h1>
        <nav>
          <button onClick={() => setView("input")}>Log</button>
          <button onClick={() => setView("trends")}>Trends</button>
        </nav>
      </header>

      <main className="content">
        {view === "input" && <ActivityInput />}
        {view === "trends" && <Trends />}
      </main>
    </div>
  );
}
