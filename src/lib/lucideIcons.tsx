import * as LucideIcons from "lucide-react";
import type { ComponentType } from "react";

// Export a curated list of icon entries: {name, Component}
// We'll include a broad subset of lucide icons for selection and searching.
// This file returns an array to be used by the icon picker UI.

type IconEntry = {
  key: string;
  Component: ComponentType<{ className?: string }>;
};

// Prioritized list of icons that map well to common categories. We try these first,
// resolve only existing exports from `lucide-react`, and then fill to `TARGET` from the
// remaining exports. This gives a consistent, relevant picker while staying robust.
const PREFERRED = [
  "Activity",
  "Alarm",
  "Anchor",
  "Aperture",
  "Archive",
  "ArrowRight",
  "Award",
  "BarChart",
  "Battery",
  "Bell",
  "Book",
  "Bookmark",
  "Briefcase",
  "Calendar",
  "Camera",
  "Car",
  "CaretDown",
  "Cart",
  "ChartPie",
  "Check",
  "ChevronLeft",
  "ChevronRight",
  "Clipboard",
  "Clock",
  "Cloud",
  "CloudRain",
  "Coffee",
  "Coin",
  "Code",
  "Compass",
  "Cpu",
  "CreditCard",
  "Database",
  "Desktop",
  "Download",
  "Droplet",
  "Edit",
  "Edit3",
  "Envelope",
  "Eye",
  "EyeOff",
  "File",
  "FileText",
  "Film",
  "Flag",
  "FlagOff",
  "Folder",
  "FolderPlus",
  "Gift",
  "Globe",
  "Globe2",
  "Grid",
  "HardDrive",
  "Headphones",
  "Heart",
  "HeartCrack",
  "Home",
  "Image",
  "Inbox",
  "Info",
  "Key",
  "KeyRound",
  "Layers",
  "Layout",
  "Link",
  "Link2",
  "List",
  "Loader",
  "Loader2",
  "Lock",
  "LogIn",
  "LogOut",
  "Map",
  "MapPin",
  "Mail",
  "Menu",
  "MessageCircle",
  "Mic",
  "MicOff",
  "Moon",
  "MoreHorizontal",
  "MoreVertical",
  "Music",
  "Navigation",
  "Phone",
  "PieChart",
  "Play",
  "Plus",
  "Printer",
  "RefreshCw",
  "Repeat",
  "Repeat2",
  "Search",
  "Send",
  "Settings",
  "Share2",
  "Shield",
  "ShoppingCart",
  "Shuffle",
  "Signal",
  "Star",
  "Sun",
  "Tag",
  "Target",
  "Thermometer",
  "ThumbsUp",
  "Time",
  "Timer",
  "Trash",
  "TrendingUp",
  "Truck",
  "Tv",
  "Umbrella",
  "Upload",
  "User",
  "Users",
  "Video",
  "Volume",
  "Wallet",
  "Watch",
  "Wifi",
  "Wrench",
  "Zap",
  "ZapOff",
  "ZoomIn",
  "ZoomOut",
  // some additional candidates for broader coverage
  "ActivitySquare",
  "Airplay",
  "BatteryCharging",
  "BellRing",
  "BookOpen",
  "Building",
  "Bus",
  "Calculator",
  "CameraOff",
  "Cast",
  "ChevronsUp",
  "Codepen",
  "Coins",
  "Columns",
  "Command",
  "Construction",
  "Contrast",
  "Crop",
  "Crosshair",
  "Cylinder",
  "Disc",
  "Divide",
  "DollarSign",
  "DownloadCloud",
  "ExternalLink",
  "Film",
  "Framer",
  "Frown",
  "GitBranch",
  "Hashtag",
  "HelpCircle",
  "Hexagon",
  "Instagram",
  "Italic",
  "Linkedin",
  "Maximize",
  "Megaphone",
  "Minimize",
  "Minus",
  "Monitor",
  "Move",
  "Paperclip",
  "Pause",
  "PlayCircle",
  "Pocket",
  "Power",
  "Radio",
  "Repeat",
  "Rss",
  "Sass",
  "Scissors",
  "Server",
  "Settings2",
  "Shape",
  "Smile",
  "Speaker",
  "Sprout",
  "Square",
  "StarOff",
  "Strikethrough",
  "Sunrise",
  "Sunset",
  "Tablet",
  "Tag",
  "Target",
  "Terminal",
  "Thermometer",
  "ThumbsDown",
  "Tool",
  "Toolpen",
  "Trello",
  "TrendingDown",
  "Trophy",
  "Truck",
  "Tv",
  "Twitter",
  "Type",
  "Umbrella",
  "Underline",
  "UploadCloud",
  "UserCheck",
  "UserMinus",
  "UserPlus",
  "UserX",
  "Users",
  "VideoOff",
  "Voicemail",
  "Volume1",
  "Volume2",
  "VolumeX",
  "Wallet",
  "WifiOff",
  "Wind",
];

const TARGET = 150;
const icons: IconEntry[] = [];
const seen = new Set<string>();

// First, try to resolve preferred names in order
const exportsMap = LucideIcons as unknown as Record<string, unknown>;
for (const name of PREFERRED) {
  const candidates = [
    name,
    name + "Icon",
    name.replace(/([A-Z])/g, " $1").trim(),
  ];
  for (const c of candidates) {
    const maybe = exportsMap[c];
    if (maybe && !seen.has(c)) {
      const Comp = maybe as ComponentType<unknown>;
      const t = typeof maybe;
      if (t !== "function" && t !== "object") continue;
      icons.push({ key: c, Component: Comp });
      seen.add(c);
      break;
    }
  }
  if (icons.length >= TARGET) break;
}

// Fill the rest from available exports if we haven't reached TARGET
if (icons.length < TARGET) {
  const allKeys = Object.keys(exportsMap || {});
  for (const key of allKeys) {
    if (icons.length >= TARGET) break;
    if (seen.has(key)) continue;
    const maybe = exportsMap[key];
    if (!maybe) continue;
    const t = typeof maybe;
    if (t !== "function" && t !== "object") continue;
    const Comp = maybe as ComponentType<unknown>;
    icons.push({ key, Component: Comp });
    seen.add(key);
  }
}

// Final fallback: ensure at least some icons
if (icons.length === 0) {
  const defaults = [
    exportsMap["Search"],
    exportsMap["Plus"],
    exportsMap["Edit"],
    exportsMap["Trash"],
  ];
  defaults.forEach((maybe, i) => {
    if (!maybe) return;
    const Comp = maybe as ComponentType<unknown>;
    icons.push({ key: `icon_${i}`, Component: Comp });
  });
}

export { icons };

export type { IconEntry };
