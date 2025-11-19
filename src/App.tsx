import React, { useState } from "react";
import Trends from "./components/Trends";
import Input from "./components/Input";
import ActivityList from "./components/ActivityList";
import Header from "./components/Header";
import DevOptions from "./components/DevOptions";
import { Toaster } from "react-hot-toast";

export default function App() {
  type ViewType = "home" | "input" | "trends";

  const [view, setView] = useState<ViewType>("home");

  function switchView(newView: ViewType) {
    setView(newView);
  }

  return (
    <div className="app">
      <Toaster position="bottom-right" />
      <Header changeView={switchView} />

      <main className="content">
        {view === "home" && <Input />}
        {view === "input" && <ActivityList />}
        {view === "trends" && <Trends />}
      </main>

      <DevOptions />
    </div>
  );
}
