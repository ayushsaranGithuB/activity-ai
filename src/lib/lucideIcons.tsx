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
  // Food
  "Utensils",
  "ChefHat",
  "Sandwich",
  "CupSoda",
  "Drumstick",

  // Meals (time-based)
  "Coffee",
  "Croissant",
  "Salad",
  "Milk",
  "Apple",

  // Work
  "Briefcase",
  "Laptop",
  "Folder",
  "ClipboardList",
  "Calendar",

  // Study / Learning
  "BookOpen",
  "Library",
  "Pencil",
  "GraduationCap",
  "Lightbulb",

  // Health / Wellness
  "HeartPulse",
  "Heartbeat",
  "Stethoscope",
  "Syringe",
  "Thermometer",

  // Exercise / Fitness
  "Dumbbell",
  "Bicycle",
  "Run",
  "StretchHorizontal",
  "Timer",

  // Sleep / Rest
  "Bed",
  "Moon",
  "Star",
  "AlarmClock",
  "Power",

  // Travel / Commute
  "Car",
  "Bus",
  "Train",
  "Plane",
  "MapPin",

  // Social / People
  "Users",
  "UserRound",
  "Handshake",
  "MessageCircle",
  "PartyPopper",

  // Household / Chores
  "Home",
  "WashingMachine",
  "Broom",
  "Bath",
  "Lightbulb",

  // Finance / Money
  "Wallet",
  "CreditCard",
  "Coins",
  "PiggyBank",
  "Banknote",

  // Shopping / Errands
  "ShoppingCart",
  "ShoppingBag",
  "Store",
  "Tag",
  "Package",

  // Hobby / Creativity
  "Camera",
  "Music",
  "Gamepad2",
  "Palette",
  "PenTool",

  // Nature / Outdoors
  "TreePine",
  "Sun",
  "Cloud",
  "Mountain",
  "Leaf",

  // Tech / Devices
  "Smartphone",
  "Tablet",
  "Monitor",
  "Headphones",
  "Keyboard",

  // Productivity
  "CheckCircle",
  "ListTodo",
  "CalendarCheck",
  "Hourglass",
  "Target",

  // Self-care / Mindfulness
  "Lotus",
  "Sparkles",
  "Candle",
  "Heart",
  "Smile",

  // Pets / Animals
  "Dog",
  "Cat",
  "Bone",
  "Fish",
  "PawPrint",

  // Transport (alternative)
  "Scooter",
  "Ship",
  "Bike",
  "Fuel",
  "Navigation",

  // Random useful common icons
  "Alarm",
  "Activity",
  "Bell",
  "Battery",
  "BarChart",
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
