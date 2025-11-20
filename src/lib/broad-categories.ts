// Broad Category Configuration and Utilities

import type { BroadCategory, BroadCategoryMapping } from "../types";

// Predefined broad category mappings with keywords for AI classification
export const BROAD_CATEGORY_MAPPINGS: BroadCategoryMapping[] = [
    {
        broad: "Work",
        subcategories: [
            "App Development",
            "Programming",
            "Coding",
            "Work",
            "Meeting",
            "Project",
            "Office",
            "Business",
            "Design",
        ],
        description: "Professional work, development, and business activities",
        keywords: [
            "work",
            "working",
            "meeting",
            "project",
            "office",
            "business",
            "coding",
            "programming",
            "development",
            "app",
            "design",
            "client",
            "job",
        ],
    },
    {
        broad: "Food",
        subcategories: [
            "Eating",
            "Drinking Beverage",
            "Cooking",
            "Meals",
            "Breakfast",
            "Lunch",
            "Dinner",
            "Snack",
            "Baking",
        ],
        description: "Eating, drinking, and food preparation activities",
        keywords: [
            "eat",
            "eating",
            "ate",
            "meal",
            "breakfast",
            "lunch",
            "dinner",
            "snack",
            "food",
            "drink",
            "drinking",
            "drank",
            "tea",
            "coffee",
            "water",
            "cooking",
            "cook",
            "baking",
            "recipe",
        ],
    },
    {
        broad: "Physical Activity",
        subcategories: [
            "Exercise",
            "Stretching",
            "Running",
            "Gym",
            "Workout",
            "Walking",
            "Cycling",
            "Swimming",
            "Yoga",
            "Sports",
        ],
        description: "Physical exercise and sports activities",
        keywords: [
            "exercise",
            "workout",
            "gym",
            "running",
            "run",
            "jogging",
            "walking",
            "walk",
            "cycling",
            "bike",
            "swimming",
            "swim",
            "yoga",
            "stretching",
            "stretch",
            "sports",
            "training",
        ],
    },
    {
        broad: "Entertainment",
        subcategories: [
            "Watching TV",
            "Gaming",
            "Movies",
            "Shows",
            "YouTube",
            "Netflix",
            "Music",
            "Podcasts",
        ],
        description: "Entertainment and leisure activities",
        keywords: [
            "watching",
            "watch",
            "watched",
            "tv",
            "movie",
            "show",
            "netflix",
            "youtube",
            "gaming",
            "game",
            "played",
            "video game",
            "music",
            "listening",
            "podcast",
        ],
    },
    {
        broad: "Home & Household",
        subcategories: [
            "Household Cleaning",
            "Cleaning",
            "Chores",
            "Laundry",
            "Organizing",
            "Home Improvement",
            "Repairs",
            "Gardening",
        ],
        description: "Home maintenance and household tasks",
        keywords: [
            "cleaning",
            "clean",
            "cleaned",
            "chore",
            "laundry",
            "wash",
            "organizing",
            "organize",
            "home",
            "house",
            "household",
            "repair",
            "fixing",
            "gardening",
            "yard",
        ],
    },
    {
        broad: "Health",
        subcategories: [
            "Relaxing Outdoors",
            "Sunbathing",
            "Meditation",
            "Spa",
            "Self-Care",
            "Mindfulness",
            "Nap",
            "Rest",
        ],
        description: "Wellness, relaxation, and self-care activities",
        keywords: [
            "relaxing",
            "relax",
            "sunbathing",
            "sunbath",
            "meditation",
            "meditate",
            "spa",
            "massage",
            "self-care",
            "mindfulness",
            "nap",
            "napping",
            "rest",
            "resting",
            "wellness",
        ],
    },
    {
        broad: "Social",
        subcategories: [
            "Friends",
            "Family",
            "Date",
            "Party",
            "Event",
            "Hangout",
            "Social Activity",
        ],
        description: "Social interactions and relationship activities",
        keywords: [
            "friend",
            "friends",
            "family",
            "date",
            "dating",
            "party",
            "event",
            "hangout",
            "hanging out",
            "social",
            "gathering",
            "visit",
            "visiting",
        ],
    },
    {
        broad: "Learning & Education",
        subcategories: [
            "Reading",
            "Studying",
            "Course",
            "Tutorial",
            "Research",
            "Learning",
            "Book",
            "Article",
        ],
        description: "Educational activities and learning",
        keywords: [
            "reading",
            "read",
            "studying",
            "study",
            "course",
            "tutorial",
            "learning",
            "learn",
            "research",
            "book",
            "article",
            "education",
            "class",
        ],
    },
    {
        broad: "Other",
        subcategories: ["Uncategorized", "General", "Miscellaneous"],
        description: "Activities that don't fit other categories",
        keywords: ["other", "misc", "uncategorized", "general"],
    },
];

// Helper function to determine broad category from subcategory name
export function getBroadCategoryForSubcategory(
    subcategory: string
): BroadCategory {
    const normalizedSubcategory = subcategory.toLowerCase();

    for (const mapping of BROAD_CATEGORY_MAPPINGS) {
        // Check if subcategory matches exactly
        const matchesSubcategory = mapping.subcategories.some(
            (sub) => sub.toLowerCase() === normalizedSubcategory
        );

        if (matchesSubcategory) {
            return mapping.broad;
        }

        // Check if any keyword matches
        const matchesKeyword = mapping.keywords.some((keyword) =>
            normalizedSubcategory.includes(keyword.toLowerCase())
        );

        if (matchesKeyword) {
            return mapping.broad;
        }
    }

    return "Other";
}

// Helper function to determine broad category from activity text
export function getBroadCategoryFromText(text: string): BroadCategory {
    const normalizedText = text.toLowerCase();

    // Score each broad category based on keyword matches
    const scores: Map<BroadCategory, number> = new Map();

    for (const mapping of BROAD_CATEGORY_MAPPINGS) {
        let score = 0;
        for (const keyword of mapping.keywords) {
            if (normalizedText.includes(keyword.toLowerCase())) {
                score++;
            }
        }
        if (score > 0) {
            scores.set(mapping.broad, score);
        }
    }

    // Return the broad category with the highest score
    if (scores.size === 0) {
        return "Other";
    }

    let maxScore = 0;
    let bestCategory: BroadCategory = "Other";

    for (const [category, score] of scores.entries()) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

// Helper function to get all subcategories for a broad category
export function getSubcategoriesForBroadCategory(
    broadCategory: BroadCategory
): string[] {
    const mapping = BROAD_CATEGORY_MAPPINGS.find((m) => m.broad === broadCategory);
    return mapping ? mapping.subcategories : [];
}

// Helper function to get description for a broad category
export function getBroadCategoryDescription(
    broadCategory: BroadCategory
): string {
    const mapping = BROAD_CATEGORY_MAPPINGS.find((m) => m.broad === broadCategory);
    return mapping ? mapping.description : "";
}

// Get all broad categories
export function getAllBroadCategories(): BroadCategory[] {
    return BROAD_CATEGORY_MAPPINGS.map((m) => m.broad);
}
