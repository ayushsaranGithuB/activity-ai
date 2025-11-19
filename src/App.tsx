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
  const [inputResetKey, setInputResetKey] = useState(0);

  function switchView(newView: ViewType) {
    setView(newView);
    // if the view is home, reset the conversation in Input component
    if (newView === "home") {
      setInputResetKey((prev) => prev + 1);
    }
  }

  return (
    <div className="app">
      <Toaster position="bottom-right" />
      <Header changeView={switchView} />

      <main className="content">
        {view === "home" && <Input resetKey={inputResetKey} />}
        {view === "input" && <ActivityList />}
        {view === "trends" && <Trends />}
      </main>

      <DevOptions />
    </div>
  );
}
