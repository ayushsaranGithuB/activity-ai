// Database Test - Run this to verify IndexedDB storage works

import { storage } from "./lib/storage";
import type { Activity } from "./types";

async function testDatabase() {
    console.log("🧪 Testing ActivityAI Database...\n");

    try {
        // Initialize database
        console.log("1. Initializing database...");
        await storage.init();
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
            const saved = await storage.addActivity(activity);
            console.log(`✓ Added: ${saved.text} (ID: ${saved.id})`);
        }
        console.log("");

        // Test retrieving all activities
        console.log("3. Retrieving all activities...");
        const allActivities = await storage.getAllActivities();
        console.log(`✓ Found ${allActivities.length} activities\n`);

        // Test adding categories
        console.log("4. Adding test categories...");
        await storage.addOrUpdateCategory({
            name: "Exercise",
            totalMinutes: 60,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await storage.addOrUpdateCategory({
            name: "Meals",
            totalMinutes: 30,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        await storage.addOrUpdateCategory({
            name: "Work",
            totalMinutes: 120,
            activityCount: 1,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
        });
        console.log("✓ Added categories\n");

        // Test getting categories
        console.log("5. Retrieving categories...");
        const categories = await storage.getAllCategories();
        console.log(`✓ Found ${categories.length} categories:`);
        categories.forEach((cat) => {
            console.log(
                `  - ${cat.name}: ${cat.activityCount} activities, ${cat.totalMinutes} minutes`
            );
        });
        console.log("");

        // Test search
        console.log("6. Testing search...");
        const searchResults = await storage.searchActivities("breakfast");
        console.log(`✓ Found ${searchResults.length} activities matching "breakfast"\n`);

        // Test category filtering
        console.log("7. Testing category filter...");
        const exerciseActivities = await storage.getActivitiesByCategory("Exercise");
        console.log(`✓ Found ${exerciseActivities.length} Exercise activities\n`);

        // Test statistics
        console.log("8. Getting statistics...");
        const stats = await storage.getStats();
        console.log(`✓ Database stats:`);
        console.log(`  - Total activities: ${stats.totalActivities}`);
        console.log(`  - Total categories: ${stats.totalCategories}`);
        if (stats.oldestActivity) {
            console.log(
                `  - Oldest activity: ${new Date(stats.oldestActivity).toLocaleString()}`
            );
        }
        if (stats.newestActivity) {
            console.log(
                `  - Newest activity: ${new Date(stats.newestActivity).toLocaleString()}`
            );
        }
        console.log("");

        console.log("✅ All database tests passed!");
        console.log("\n💡 To clear the database, run: storage.clearAllData()");
    } catch (error) {
        console.error("❌ Database test failed:", error);
    }
}

export { testDatabase };
