import {
  Info,
  ChartNoAxesCombined,
  ClipboardClock,
  House,
  Settings,
} from "lucide-react";
import "../css/menu.css";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  changeView: (view: "home" | "input" | "trends" | "settings") => void;
}

const Menu = ({ isOpen, onClose, changeView }: MenuProps) => {
  const handleNavClick = (view: "home" | "input" | "trends" | "settings") => {
    changeView(view);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="menu-overlay" onClick={onClose} />}
      <nav id="main-menu" className={isOpen ? "menu-open" : ""}>
        <ul className="main-menu-section">
          <li>
            <button onClick={() => handleNavClick("home")}>
              <House size={18} />
              Home
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick("input")}>
              <ClipboardClock size={18} />
              Log
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick("trends")}>
              <ChartNoAxesCombined size={18} />
              Trends
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick("settings")}>
              <Settings size={18} />
              Settings
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick("settings")}>
              <Info size={18} />
              App Info
            </button>
          </li>
        </ul>
        {/* <ul className="main-menu-section">
          <li className="menu-section-title">Developer Tools</li>
        </ul> */}
        <ul className="menu-footer">
          <li>Activity AI © 2024</li>
        </ul>
      </nav>
    </>
  );
};

export default Menu;
