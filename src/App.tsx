import React, { useState } from "react";
import Trends from "./components/Trends";
import { CircleDotDashed } from "lucide-react";
import Input from "./components/Input";
import ActivityList from "./components/ActivityList";

export default function App() {
  const [view, setView] = useState<"home" | "input" | "trends">("input");

  return (
    <div className="app">
      <header className="topbar">
        <h1>Activity AI (TS)</h1>
        <nav>
          <button onClick={() => setView("input")}>Log</button>
          <button onClick={() => setView("home")}>Home</button>
          <button onClick={() => setView("trends")}>Trends</button>
        </nav>
      </header>

      <main className="content">
        <div className="logo">
          <CircleDotDashed size={24} color="rgba(85, 198, 169, 1)" />
        </div>
        {view === "home" && <Input />}
        {view === "input" && <ActivityList />}
        {view === "trends" && <Trends />}
      </main>
    </div>
  );
}
