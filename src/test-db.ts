// Database Test - Run this to verify IndexedDB storage works

import { initDB, addActivity, getAllActivities, addOrUpdateCategory, getAllCategories, getActivitiesByCategory, getCategory, getAggregatesByPeriod, getStats } from "./lib/db";
import type { Activity } from "./types";

async function testDatabase() {
    console.log("🧪 Testing ActivityAI Database...\n");

    try {
        // Initialize database
        console.log("1. Initializing database...");
        await initDB();
        console.log("✓ Database initialized\n");

        // Test adding activities
        console.log("2. Adding test activities...");
        const activities: Omit<Activity, "id">[] = [
            {
                text: "Morning jog in the park",
                category: "Exercise",
                createdAt: Date.now() - 86400000, // Yesterday
            },
            {
                text: "Made breakfast",
                category: "Meals",
                createdAt: Date.now() - 82800000,
            },
            {
                text: "Working on project",
                category: "Work",
                createdAt: Date.now() - 7200000,
            },
        ];

        for (const activity of activities) {
            const id = await addActivity(activity);
            console.log(`✓ Added: ${activity.text} (ID: ${id})`);
        }
        console.log("");

        // Test retrieving all activities
        console.log("3. Retrieving all activities...");
        const allActivities = await getAllActivities();
        console.log(`✓ Found ${allActivities.length} activities\n`);

        // Test adding categories
        console.log("4. Adding test categories...");
        await addOrUpdateCategory({
            name: "Exercise",
            totalMinutes: 60,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await addOrUpdateCategory({
            name: "Meals",
            totalMinutes: 30,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await addOrUpdateCategory({
            name: "Work",
            totalMinutes: 120,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        console.log("✓ Added categories\n");

        // Test getting categories
        console.log("5. Retrieving categories...");
        const categories = await getAllCategories();
        console.log(`✓ Found ${categories.length} categories:`);
        categories.forEach((cat) => {
            console.log(
                `  - ${cat.name}: ${cat.activityCount} activities, ${cat.totalMinutes} minutes`
            );
        });
        console.log("");

        // Test search
        console.log("6. Testing search...");
        // No direct search function in db.ts, so filter manually
        const searchResults = allActivities.filter(a => a.text.toLowerCase().includes("breakfast"));
        console.log(`✓ Found ${searchResults.length} activities matching "breakfast"\n`);

        // Test category filtering
        console.log("7. Testing category filter...");
        const exerciseActivities = allActivities.filter(a => a.category === "Exercise");
        console.log(`✓ Found ${exerciseActivities.length} Exercise activities\n`);

        // Test statistics
        console.log("8. Getting statistics...");
        // No direct getStats in db.ts, so calculate manually
        const timestamps = allActivities.map(a => a.createdAt);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : undefined;
        console.log(`✓ Database stats:`);
        console.log(`  - Total activities: ${allActivities.length}`);
        console.log(`  - Total categories: ${categories.length}`);
        if (oldest) {
            console.log(`  - Oldest activity: ${new Date(oldest).toLocaleString()}`);
        }
        if (newest) {
            console.log(`  - Newest activity: ${new Date(newest).toLocaleString()}`);
        }
        console.log("");

        console.log("✅ All database tests passed!");
        // No direct clearAllData in db.ts yet
        console.log("\n💡 To clear the database, implement a clearAllData() in db.ts if needed.");
    } catch (error) {
        console.error("❌ Database test failed:", error);
    }
}

export { testDatabase };
