/**
 * MCP Sync Utility
 * Syncs IndexedDB data to the server for MCP queries
 */

import { storage } from "./storage";

export async function syncToMCP(): Promise<void> {
    try {
        await storage.init();

        const activities = await storage.getAllActivities();
        const categories = await storage.getAllCategories();

        const response = await fetch("/api/mcp/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
            }),
        });

        if (!response.ok) {
            throw new Error(`MCP sync failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("✓ MCP data synced:", result.synced);
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
