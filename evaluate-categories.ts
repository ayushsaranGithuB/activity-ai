// Script to evaluate current categories in the database

import { storage } from "./src/lib/storage";
import type { Category } from "./src/types";

async function evaluateCategories() {
    console.log("📊 Evaluating Current Categories in Database\n");
    console.log("=".repeat(60));

    try {
        // Initialize database
        await storage.init();

        // Get all categories
        const categories = await storage.getAllCategories();
        const activities = await storage.getAllActivities();

        console.log(`\n📈 OVERVIEW`);
        console.log(`   Total Categories: ${categories.length}`);
        console.log(`   Total Activities: ${activities.length}`);
        console.log(`\n${"=".repeat(60)}\n`);

        if (categories.length === 0) {
            console.log("⚠️  No categories found in database");
            console.log("   The database appears to be empty or not initialized.\n");
            return;
        }

        // Sort categories by activity count (descending)
        const sortedCategories = [...categories].sort((a, b) =>
            b.activityCount - a.activityCount
        );

        console.log(`📋 CURRENT CATEGORIES (sorted by usage)\n`);

        // Display each category with details
        sortedCategories.forEach((cat, index) => {
            const avgMinutesPerActivity = cat.activityCount > 0
                ? (cat.totalMinutes / cat.activityCount).toFixed(1)
                : 0;

            const lastUsed = new Date(cat.lastUsedAt).toLocaleDateString();
            const created = new Date(cat.createdAt).toLocaleDateString();

            console.log(`${index + 1}. ${cat.name}`);
            console.log(`   └─ Activities: ${cat.activityCount}`);
            console.log(`   └─ Total Time: ${cat.totalMinutes} minutes (${(cat.totalMinutes / 60).toFixed(1)} hours)`);
            console.log(`   └─ Avg Time/Activity: ${avgMinutesPerActivity} minutes`);
            console.log(`   └─ Last Used: ${lastUsed}`);
            console.log(`   └─ Created: ${created}`);
            console.log();
        });

        console.log("=".repeat(60));
        console.log("\n🔍 CATEGORY ANALYSIS\n");

        // Find potential duplicates or similar categories
        const potentialDuplicates: string[] = [];

        for (let i = 0; i < categories.length; i++) {
            for (let j = i + 1; j < categories.length; j++) {
                const name1 = categories[i].name.toLowerCase();
                const name2 = categories[j].name.toLowerCase();

                // Check for similar names
                if (name1.includes(name2) || name2.includes(name1)) {
                    potentialDuplicates.push(`"${categories[i].name}" ↔ "${categories[j].name}"`);
                }
            }
        }

        if (potentialDuplicates.length > 0) {
            console.log("⚠️  Potential Similar/Duplicate Categories:");
            potentialDuplicates.forEach(dup => console.log(`   • ${dup}`));
            console.log();
        } else {
            console.log("✓ No obvious duplicate categories detected\n");
        }

        // Category distribution analysis
        const totalTime = categories.reduce((sum, cat) => sum + cat.totalMinutes, 0);
        console.log("📊 TIME DISTRIBUTION:");
        console.log(`   Total Time Tracked: ${totalTime} minutes (${(totalTime / 60).toFixed(1)} hours)\n`);

        const topCategories = sortedCategories.slice(0, 5);
        console.log("   Top 5 Categories by Time:");
        topCategories.forEach((cat, idx) => {
            const percentage = totalTime > 0 ? ((cat.totalMinutes / totalTime) * 100).toFixed(1) : 0;
            console.log(`   ${idx + 1}. ${cat.name}: ${cat.totalMinutes} min (${percentage}%)`);
        });

        console.log("\n" + "=".repeat(60));
        console.log("\n📝 SAMPLE ACTIVITIES BY CATEGORY\n");

        // Show sample activities for top categories
        for (const cat of topCategories.slice(0, 3)) {
            const catActivities = activities.filter(a => a.category === cat.name);
            console.log(`${cat.name} (${catActivities.length} activities):`);

            const samples = catActivities.slice(0, 3);
            samples.forEach(act => {
                console.log(`   • ${act.text}`);
            });

            if (catActivities.length > 3) {
                console.log(`   ... and ${catActivities.length - 3} more`);
            }
            console.log();
        }

        console.log("=".repeat(60));
        console.log("\n💡 RECOMMENDATIONS FOR BROADER CATEGORIES\n");

        // Analyze current categories and suggest broader groupings
        const recommendations = analyzeForBroaderCategories(categories);
        recommendations.forEach(rec => {
            console.log(`${rec.broadCategory}:`);
            console.log(`   Potential subcategories: ${rec.subcategories.join(", ")}`);
            console.log(`   Reasoning: ${rec.reasoning}`);
            console.log();
        });

        console.log("=".repeat(60) + "\n");

    } catch (error) {
        console.error("❌ Error evaluating categories:", error);
    }
}

interface CategoryRecommendation {
    broadCategory: string;
    subcategories: string[];
    reasoning: string;
}

function analyzeForBroaderCategories(categories: Category[]): CategoryRecommendation[] {
    const recommendations: CategoryRecommendation[] = [];
    const categoryNames = categories.map(c => c.name);

    // Common patterns to look for
    const patterns = [
        {
            broad: "Physical Activity",
            keywords: ["exercise", "running", "gym", "workout", "walking", "cycling", "swimming", "yoga", "sports"],
            reasoning: "Physical activities and exercise should be grouped together"
        },
        {
            broad: "Food & Nutrition",
            keywords: ["meal", "breakfast", "lunch", "dinner", "eating", "cooking", "food", "snack"],
            reasoning: "All eating and food preparation activities"
        },
        {
            broad: "Work & Professional",
            keywords: ["work", "meeting", "project", "office", "business", "coding", "programming"],
            reasoning: "Professional and work-related activities"
        },
        {
            broad: "Entertainment & Leisure",
            keywords: ["movie", "tv", "gaming", "entertainment", "watching", "playing"],
            reasoning: "Recreational and entertainment activities"
        },
        {
            broad: "Social & Relationships",
            keywords: ["social", "friend", "family", "date", "hangout", "coffee", "chat"],
            reasoning: "Social interactions and relationship building"
        },
        {
            broad: "Learning & Education",
            keywords: ["study", "reading", "learning", "course", "book", "research"],
            reasoning: "Educational and self-improvement activities"
        },
        {
            broad: "Home & Household",
            keywords: ["cleaning", "chore", "household", "laundry", "organizing", "home"],
            reasoning: "Home maintenance and household tasks"
        }
    ];

    patterns.forEach(pattern => {
        const matches = categoryNames.filter(name =>
            pattern.keywords.some(keyword =>
                name.toLowerCase().includes(keyword)
            )
        );

        if (matches.length > 0) {
            recommendations.push({
                broadCategory: pattern.broad,
                subcategories: matches,
                reasoning: pattern.reasoning
            });
        }
    });

    // Find categories that don't match any pattern
    const matchedCategories = new Set(
        recommendations.flatMap(rec => rec.subcategories)
    );

    const unmatchedCategories = categoryNames.filter(
        name => !matchedCategories.has(name)
    );

    if (unmatchedCategories.length > 0) {
        recommendations.push({
            broadCategory: "Other Activities",
            subcategories: unmatchedCategories,
            reasoning: "Categories that don't fit common patterns - may need custom broad categories"
        });
    }

    return recommendations;
}

// Run the evaluation
evaluateCategories().then(() => {
    console.log("✅ Evaluation complete!\n");
    process.exit(0);
}).catch(error => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});
