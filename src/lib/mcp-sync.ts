/**
 * MCP Sync Utility
 * Prepares local data for MCP queries (no server sync)
 */

import { storage } from "./storage";

export async function syncToMCP(): Promise<void> {
    try {
        await storage.init();
        const activities = await storage.getAllActivities();
        const categories = await storage.getAllCategories();
        // Local-only MCP sync: just log the data for now
        console.log("✓ MCP data ready for sync:", {
            activities: activities.map(a => ({
                id: a.id,
                text: a.text,
                category: a.category,
                createdAt: a.createdAt,
            })),
            categories: categories.map(c => ({
                name: c.name,
                description: c.description,
                broadCategory: c.broadCategory,
                totalMinutes: c.totalMinutes,
                activityCount: c.activityCount,
                createdAt: c.createdAt,
                lastUsedAt: c.lastUsedAt,
            })),
        });
    } catch (error) {
        console.error("Failed to sync data to MCP:", error);
    }
}

// Auto-sync on page load
if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
        syncToMCP();
    });
}
