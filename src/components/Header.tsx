import {
  ChartNoAxesCombined,
  ClipboardClock,
  House,
  Settings,
} from "lucide-react";

export default function Header({
  changeView,
}: {
  changeView: (view: "home" | "input" | "trends" | "settings") => void;
}) {
  return (
    <header className="topbar">
      <nav>
        <button id="nav-btn-home" onClick={() => changeView("home")}>
          <House size={18} />
        </button>
        <button id="nav-btn-log" onClick={() => changeView("input")}>
          <ClipboardClock size={16} /> Log
        </button>
        <button id="nav-btn-trends" onClick={() => changeView("trends")}>
          <ChartNoAxesCombined size={16} /> Trends
        </button>
        <button id="nav-btn-settings" onClick={() => changeView("settings")}>
          <Settings size={16} />
        </button>
      </nav>
    </header>
  );
}
