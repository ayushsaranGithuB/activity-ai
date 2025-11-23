// Category Configuration and Utilities for AI Guidance

import type { CategoryMapping } from "../types";

// Predefined category mappings with examples for AI classification guidance
export const CATEGORY_MAPPINGS: CategoryMapping[] = [
    {
        name: "Work",
        description: "Professional work, development, and business activities",
        examples: [
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
        name: "Food",
        description: "Eating, drinking, and food preparation activities",
        examples: [
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
        name: "Exercise",
        description: "Physical exercise and sports activities",
        examples: [
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
        name: "Entertainment",
        description: "Entertainment and leisure activities",
        examples: [
            "Watching TV",
            "Gaming",
            "Movies",
            "Shows",
            "YouTube",
            "Netflix",
            "Music",
            "Podcasts",
        ],
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
        name: "Errands & Chores",
        description: "Home maintenance and household tasks",
        examples: [
            "Household Cleaning",
            "Cleaning",
            "Chores",
            "Laundry",
            "Organizing",
            "Home Improvement",
            "Repairs",
            "Gardening",
        ],
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
        name: "Health",
        description: "Wellness, relaxation, and self-care activities",
        examples: [
            "Relaxing Outdoors",
            "Sunbathing",
            "Meditation",
            "Spa",
            "Self-Care",
            "Mindfulness",
            "Nap",
            "Rest",
        ],
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
        name: "Sleep",
        description: "Sleep, bedtime, naps, and related rest activities",
        examples: [
            "Sleeping",
            "Nap",
            "Bedtime",
            "Overnight Sleep",
            "Resting in Bed",
        ],
        keywords: [
            "sleep",
            "sleeping",
            "slept",
            "nap",
            "napping",
            "bed",
            "bedtime",
            "asleep",
            "insomnia",
            "rest",
            "resting",
        ],
    },
    {
        name: "Social",
        description: "Social interactions and relationship activities",
        examples: [
            "Friends",
            "Family",
            "Date",
            "Party",
            "Event",
            "Hangout",
            "Social Activity",
        ],
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
        name: "Learning & Education",
        description: "Educational activities and learning",
        examples: [
            "Reading",
            "Studying",
            "Course",
            "Tutorial",
            "Research",
            "Learning",
            "Book",
            "Article",
        ],
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
];

// Helper function to determine category from activity text
export function getCategoryFromText(text: string): string {
    const normalizedText = text.toLowerCase();

    // Score each category based on keyword matches
    const scores: Map<string, number> = new Map();

    for (const mapping of CATEGORY_MAPPINGS) {
        let score = 0;
        for (const keyword of mapping.keywords) {
            if (normalizedText.includes(keyword.toLowerCase())) {
                score++;
            }
        }
        if (score > 0) {
            scores.set(mapping.name, score);
        }
    }

    // Return the category with the highest score
    if (scores.size === 0) {
        return "Other";
    }

    let maxScore = 0;
    let bestCategory = "Other";

    for (const [category, score] of scores.entries()) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

// Helper function to get examples for a category
export function getExamplesForCategory(categoryName: string): string[] {
    const mapping = CATEGORY_MAPPINGS.find((m) => m.name === categoryName);
    return mapping ? mapping.examples : [];
}

// Helper function to get description for a category
export function getCategoryDescription(categoryName: string): string {
    const mapping = CATEGORY_MAPPINGS.find((m) => m.name === categoryName);
    return mapping ? mapping.description : "";
}

// Get all category names
export function getAllCategoryNames(): string[] {
    return CATEGORY_MAPPINGS.map((m) => m.name);
}
