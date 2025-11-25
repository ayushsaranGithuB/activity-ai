import { icons } from "@/lib/lucideIcons";

// Simple heuristic: map category name keywords to icon keys
const keywordMap: Record<string, string> = {
    work: "Briefcase",
    food: "Coffee",
    exercise: "Activity",
    entertainment: "Music",
    errands: "Truck",
    chores: "Home",
    health: "Heart",
    sleep: "Moon",
    social: "Users",
    learning: "Book",
    education: "Book",
    other: "Tag",
};

export function suggestIconForName(name: string): string | undefined {
    const n = (name || "").toLowerCase();
    for (const key of Object.keys(keywordMap)) {
        if (n.includes(key)) return keywordMap[key];
    }

    // fallback: try to pick an icon whose key matches part of name
    const parts = n.split(/[^a-z0-9]+/).filter(Boolean);
    for (const p of parts) {
        const found = icons.find((i) => i.key.toLowerCase().includes(p));
        if (found) return found.key;
    }

    // last resort: return first icon
    return icons[0]?.key;
}
