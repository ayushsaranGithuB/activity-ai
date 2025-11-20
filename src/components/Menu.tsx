import {
  Info,
  ChartNoAxesCombined,
  ClipboardClock,
  House,
  Settings,
} from "lucide-react";
import "../css/menu.css";
import { ViewType } from "../types/views";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  changeView: (view: ViewType) => void;
}

const Menu = ({ isOpen, onClose, changeView }: MenuProps) => {
  const handleNavClick = (view: ViewType) => {
    changeView(view);
    onClose();
  };

  return (
    <>
      <nav id="main-menu" className={isOpen ? "menu-open" : "menu-closed"}>
        {/* close btn */}
        <button
          className="menu-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          &times;
        </button>
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
            <button onClick={() => handleNavClick("info")}>
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
