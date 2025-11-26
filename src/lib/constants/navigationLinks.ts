import {
  Home,
  TrendingUp,
  Settings as SettingsIcon,
  SquareChartGantt,
} from "lucide-react";

const navigation = [
    { path: "/", name: "Home", icon: Home },
    { path: "/timeline", name: "Timeline", icon: SquareChartGantt },
    { path: "/trends", name: "Trends", icon: TrendingUp },
    { path: "/settings", name: "Settings", icon: SettingsIcon },
  ];

export default navigation;