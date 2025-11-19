// IndexedDB Storage Layer for Activity AI

import { openDB, type IDBPDatabase } from "idb";
import type { Activity, Category, Aggregate, StorageStats } from "../types";

const DB_NAME = "ActivityAI";
const DB_VERSION = 1;

// Store names
const STORES = {
    ACTIVITIES: "activities",
    CATEGORIES: "categories",
    AGGREGATES: "aggregates",
} as const;

class ActivityStorage {
    private db: IDBPDatabase | null = null;

    async init(): Promise<void> {
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Activities store
                if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
                    const activityStore = db.createObjectStore(STORES.ACTIVITIES, {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    activityStore.createIndex("category", "category");
                    activityStore.createIndex("createdAt", "createdAt");
                    activityStore.createIndex("text", "text");
                }

                // Categories store
                if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                    const categoryStore = db.createObjectStore(STORES.CATEGORIES, {
                        keyPath: "name",
                    });
                    categoryStore.createIndex("totalMinutes", "totalMinutes");
                    categoryStore.createIndex("lastUsedAt", "lastUsedAt");
                }

                // Aggregates store
                if (!db.objectStoreNames.contains(STORES.AGGREGATES)) {
                    const aggregateStore = db.createObjectStore(STORES.AGGREGATES, {
                        keyPath: ["category", "period", "periodStart"],
                    });
                    aggregateStore.createIndex("category", "category");
                    aggregateStore.createIndex("period", "period");
                    aggregateStore.createIndex("periodStart", "periodStart");
                }
            },
        });
    }

    private ensureDB(): IDBPDatabase {
        if (!this.db) {
            throw new Error("Database not initialized. Call init() first.");
        }
        return this.db;
    }

    // ========================================================================
    // Activity Operations
    // ========================================================================

    async addActivity(activity: Omit<Activity, "id">): Promise<Activity> {
        const db = this.ensureDB();
        const id = await db.add(STORES.ACTIVITIES, activity);
        return { ...activity, id: id as number };
    }

    async getActivity(id: number): Promise<Activity | undefined> {
        const db = this.ensureDB();
        return db.get(STORES.ACTIVITIES, id);
    }

    async getAllActivities(): Promise<Activity[]> {
        const db = this.ensureDB();
        return db.getAll(STORES.ACTIVITIES);
    }

    async getActivitiesByCategory(category: string): Promise<Activity[]> {
        const db = this.ensureDB();
        return db.getAllFromIndex(STORES.ACTIVITIES, "category", category);
    }

    async getActivitiesInRange(start: number, end: number): Promise<Activity[]> {
        const db = this.ensureDB();
        const all = await db.getAll(STORES.ACTIVITIES);
        return all.filter((a) => a.createdAt >= start && a.createdAt <= end);
    }

    async updateActivity(activity: Activity): Promise<void> {
        const db = this.ensureDB();
        await db.put(STORES.ACTIVITIES, activity);
    }

    async deleteActivity(id: number): Promise<void> {
        const db = this.ensureDB();
        await db.delete(STORES.ACTIVITIES, id);
    }

    async searchActivities(query: string): Promise<Activity[]> {
        const db = this.ensureDB();
        const all = await db.getAll(STORES.ACTIVITIES);
        const lowerQuery = query.toLowerCase();
        return all.filter(
            (a) =>
                a.text.toLowerCase().includes(lowerQuery) ||
                a.category.toLowerCase().includes(lowerQuery)
        );
    }

    // ========================================================================
    // Category Operations
    // ========================================================================

    async addOrUpdateCategory(category: Category): Promise<void> {
        const db = this.ensureDB();
        await db.put(STORES.CATEGORIES, category);
    }

    async getCategory(name: string): Promise<Category | undefined> {
        const db = this.ensureDB();
        return db.get(STORES.CATEGORIES, name);
    }

    async getAllCategories(): Promise<Category[]> {
        const db = this.ensureDB();
        return db.getAll(STORES.CATEGORIES);
    }

    async getCategoryNames(): Promise<string[]> {
        const categories = await this.getAllCategories();
        return categories.map((c) => c.name);
    }

    async deleteCategory(name: string): Promise<void> {
        const db = this.ensureDB();
        await db.delete(STORES.CATEGORIES, name);
    }

    async mergeCategories(from: string, into: string): Promise<void> {
        const db = this.ensureDB();

        // Get all activities with the old category
        const activities = await this.getActivitiesByCategory(from);

        // Update each activity to use the new category
        const tx = db.transaction(STORES.ACTIVITIES, "readwrite");
        for (const activity of activities) {
            activity.category = into;
            await tx.store.put(activity);
        }
        await tx.done;

        // Update category stats
        const fromCategory = await this.getCategory(from);
        const intoCategory = await this.getCategory(into);

        if (fromCategory && intoCategory) {
            intoCategory.totalMinutes += fromCategory.totalMinutes;
            intoCategory.activityCount += fromCategory.activityCount;
            await this.addOrUpdateCategory(intoCategory);
        }

        // Delete the old category
        await this.deleteCategory(from);
    }

    // ========================================================================
    // Aggregate Operations
    // ========================================================================

    async addOrUpdateAggregate(aggregate: Aggregate): Promise<void> {
        const db = this.ensureDB();
        await db.put(STORES.AGGREGATES, aggregate);
    }

    async getAggregate(
        category: string,
        period: "week" | "month" | "year",
        periodStart: number
    ): Promise<Aggregate | undefined> {
        const db = this.ensureDB();
        return db.get(STORES.AGGREGATES, [category, period, periodStart]);
    }

    async getAggregatesByPeriod(
        period: "week" | "month" | "year"
    ): Promise<Aggregate[]> {
        const db = this.ensureDB();
        return db.getAllFromIndex(STORES.AGGREGATES, "period", period);
    }

    async getAggregatesByCategory(category: string): Promise<Aggregate[]> {
        const db = this.ensureDB();
        return db.getAllFromIndex(STORES.AGGREGATES, "category", category);
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    async getStats(): Promise<StorageStats> {
        const activities = await this.getAllActivities();
        const categories = await this.getAllCategories();

        const timestamps = activities.map((a) => a.createdAt);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : undefined;

        return {
            totalActivities: activities.length,
            totalCategories: categories.length,
            oldestActivity: oldest,
            newestActivity: newest,
        };
    }

    // ========================================================================
    // Maintenance
    // ========================================================================

    async clearAllData(): Promise<void> {
        const db = this.ensureDB();
        const tx = db.transaction(
            [STORES.ACTIVITIES, STORES.CATEGORIES, STORES.AGGREGATES],
            "readwrite"
        );
        await tx.objectStore(STORES.ACTIVITIES).clear();
        await tx.objectStore(STORES.CATEGORIES).clear();
        await tx.objectStore(STORES.AGGREGATES).clear();
        await tx.done;
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Singleton instance
export const storage = new ActivityStorage();
