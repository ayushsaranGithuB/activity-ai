// IndexedDB Storage Layer for Activity AI

import { openDB, type IDBPDatabase } from "idb";
import type { Activity, Category, Aggregate, StorageStats, BroadCategory } from "../types";
import { getBroadCategoryForSubcategory } from "./broad-categories";

const DB_NAME = "ActivityAI";
const DB_VERSION = 2; // Incremented to support broad categories

// Store names
const STORES = {
    ACTIVITIES: "activities",
    CATEGORIES: "categories",
    AGGREGATES: "aggregates",
} as const;

class ActivityStorage {
    private db: IDBPDatabase | null = null;

    async init(): Promise<void> {
        console.log("🔧 Storage: Initializing database...");
        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`🔧 Storage: Upgrading database from v${oldVersion} to v${newVersion}`);

                // Activities store
                if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
                    console.log("🔧 Storage: Creating ACTIVITIES store");
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
                    console.log("🔧 Storage: Creating CATEGORIES store");
                    const categoryStore = db.createObjectStore(STORES.CATEGORIES, {
                        keyPath: "name",
                    });
                    categoryStore.createIndex("totalMinutes", "totalMinutes");
                    categoryStore.createIndex("lastUsedAt", "lastUsedAt");
                    categoryStore.createIndex("broadCategory", "broadCategory");
                    categoryStore.createIndex("isBroadCategory", "isBroadCategory");
                } else if (oldVersion < 2) {
                    // Migration: Add new indexes for broad categories
                    console.log("🔧 Storage: Migrating CATEGORIES store to v2");
                    const categoryStore = transaction.objectStore(STORES.CATEGORIES);
                    if (!categoryStore.indexNames.contains("broadCategory")) {
                        console.log("🔧 Storage: Adding broadCategory index");
                        categoryStore.createIndex("broadCategory", "broadCategory");
                    }
                    if (!categoryStore.indexNames.contains("isBroadCategory")) {
                        console.log("🔧 Storage: Adding isBroadCategory index");
                        categoryStore.createIndex("isBroadCategory", "isBroadCategory");
                    }

                    // Migrate existing categories to assign broad categories
                    console.log("🔧 Storage: Starting automatic category migration");
                    categoryStore.openCursor().then(function migrateCursor(cursor) {
                        if (!cursor) {
                            console.log("🔧 Storage: Automatic category migration complete");
                            return;
                        }
                        const category = cursor.value;
                        if (!category.broadCategory) {
                            const broadCat = getBroadCategoryForSubcategory(category.name);
                            console.log(`🔧 Storage: Auto-migrating "${category.name}" → "${broadCat}"`);
                            category.broadCategory = broadCat;
                            category.isBroadCategory = false;
                            cursor.update(category);
                        }
                        cursor.continue().then(migrateCursor);
                    });
                }

                // Aggregates store
                if (!db.objectStoreNames.contains(STORES.AGGREGATES)) {
                    console.log("🔧 Storage: Creating AGGREGATES store");
                    const aggregateStore = db.createObjectStore(STORES.AGGREGATES, {
                        keyPath: ["category", "period", "periodStart"],
                    });
                    aggregateStore.createIndex("category", "category");
                    aggregateStore.createIndex("period", "period");
                    aggregateStore.createIndex("periodStart", "periodStart");
                }
            },
        });
        console.log("✅ Storage: Database initialized successfully");
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
        console.log("💾 Storage: addOrUpdateCategory called with:", category);
        const db = this.ensureDB();
        await db.put(STORES.CATEGORIES, category);
        console.log("✅ Storage: addOrUpdateCategory completed for:", category.name);
    }

    async getCategory(name: string): Promise<Category | undefined> {
        const db = this.ensureDB();
        return db.get(STORES.CATEGORIES, name);
    }

    async getAllCategories(): Promise<Category[]> {
        console.log("📊 Storage: getAllCategories called");
        const db = this.ensureDB();
        const categories = await db.getAll(STORES.CATEGORIES);
        console.log("✅ Storage: getAllCategories returned", categories.length, "categories:", categories);
        return categories;
    }

    async getCategoryNames(): Promise<string[]> {
        const categories = await this.getAllCategories();
        return categories.map((c) => c.name);
    }

    async deleteCategory(name: string): Promise<void> {
        const db = this.ensureDB();
        await db.delete(STORES.CATEGORIES, name);
    }

    async getCategoriesByBroadCategory(
        broadCategory: BroadCategory
    ): Promise<Category[]> {
        const db = this.ensureDB();
        return db.getAllFromIndex(STORES.CATEGORIES, "broadCategory", broadCategory);
    }

    async getBroadCategories(): Promise<BroadCategory[]> {
        // Get all unique broad categories from existing subcategories
        const db = this.ensureDB();
        const allCategories = await db.getAll(STORES.CATEGORIES);
        const broadCategories = new Set<BroadCategory>();

        allCategories.forEach(cat => {
            if (cat.broadCategory) {
                broadCategories.add(cat.broadCategory);
            }
        });

        return Array.from(broadCategories);
    }

    async getSubcategories(broadCategory: BroadCategory): Promise<Category[]> {
        return this.getCategoriesByBroadCategory(broadCategory);
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
