// Migration from backup JSON to SQLite
import backupData from '../../backups/activity-ai-backup-2025-11-21T06_05_37.961Z.json';

export async function migrateBackupJsonToSQLite() {
    const { activities, categories, aggregates } = backupData;

    // Insert activities
    for (const activity of activities) {
        const { id, ...rest } = activity;
        await addActivity(rest);
    }

    // Insert categories
    for (const category of categories) {
        // Ensure broadCategory is cast to BroadCategory type
        const fixedCategory = {
            ...category,
            broadCategory: category.broadCategory as any, // or as BroadCategory
            createdAt: category.createdAt ?? Date.now(),
        };
        await addOrUpdateCategory(fixedCategory);
    }

    // Insert aggregates
    for (const aggregate of aggregates) {
        await addOrUpdateAggregate(aggregate);
    }

    return {
        activities: activities.length,
        categories: categories.length,
        aggregates: aggregates.length,
    };
}
// Migration from IndexedDB to SQLite
import { storage } from './storage';

export async function migrateIndexedDBToSQLite() {
    // Export all data from IndexedDB
    const { activities, categories, aggregates } = await storage.exportAllData();

    // Insert activities
    for (const activity of activities) {
        // Remove id so it autoincrements
        const { id, ...rest } = activity;
        await addActivity(rest);
    }

    // Insert categories
    for (const category of categories) {
        await addOrUpdateCategory(category);
    }

    // Insert aggregates
    for (const aggregate of aggregates) {
        await addOrUpdateAggregate(aggregate);
    }

    return {
        activities: activities.length,
        categories: categories.length,
        aggregates: aggregates.length,
    };
}


import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { Activity, Category, Aggregate } from '../types';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

export async function initDB() {
    if (!db) {
        db = await sqlite.createConnection('activity-ai', false, 'no-encryption', 1, false);
        await db.open();
        // Create tables if not exist
        await db.execute(
            `CREATE TABLE IF NOT EXISTS activities (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL,
				category TEXT NOT NULL,
				createdAt INTEGER NOT NULL,
				meta TEXT
			);`
        );
        await db.execute(
            `CREATE TABLE IF NOT EXISTS categories (
				name TEXT PRIMARY KEY,
				description TEXT,
				broadCategory TEXT,
				isBroadCategory INTEGER,
				totalMinutes INTEGER NOT NULL,
				activityCount INTEGER NOT NULL,
				createdAt INTEGER NOT NULL,
				lastUsedAt INTEGER NOT NULL
			);`
        );
        await db.execute(
            `CREATE TABLE IF NOT EXISTS aggregates (
				category TEXT NOT NULL,
				period TEXT NOT NULL,
				periodStart INTEGER NOT NULL,
				totalMinutes INTEGER NOT NULL,
				activityCount INTEGER NOT NULL,
				PRIMARY KEY (category, period, periodStart)
			);`
        );
    }
}

// Activity CRUD
export async function addActivity(activity: Omit<Activity, 'id'>): Promise<number> {
    await initDB();
    const res = await db!.run(
        `INSERT INTO activities (text, category, createdAt, meta) VALUES (?, ?, ?, ?);`,
        [activity.text, activity.category, activity.createdAt, JSON.stringify(activity.meta)]
    );
    return res.changes.lastId as number;
}

export async function getActivity(id: number): Promise<Activity | null> {
    await initDB();
    const res = await db!.query(`SELECT * FROM activities WHERE id = ?;`, [id]);
    return res.values?.[0] as Activity || null;
}

export async function getAllActivities(): Promise<Activity[]> {
    await initDB();
    const res = await db!.query(`SELECT * FROM activities;`);
    return (res.values as Activity[]) || [];
}

export async function updateActivity(activity: Activity): Promise<void> {
    await initDB();
    await db!.run(
        `UPDATE activities SET text = ?, category = ?, createdAt = ?, meta = ? WHERE id = ?;`,
        [activity.text, activity.category, activity.createdAt, JSON.stringify(activity.meta), activity.id]
    );
}

export async function deleteActivity(id: number): Promise<void> {
    await initDB();
    await db!.run(`DELETE FROM activities WHERE id = ?;`, [id]);
}

// Category CRUD
export async function addOrUpdateCategory(category: Category): Promise<void> {
    await initDB();
    await db!.run(
        `INSERT OR REPLACE INTO categories (name, description, broadCategory, isBroadCategory, totalMinutes, activityCount, createdAt, lastUsedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [category.name, category.description, category.broadCategory, category.isBroadCategory ? 1 : 0, category.totalMinutes, category.activityCount, category.createdAt, category.lastUsedAt]
    );
}

export async function getCategory(name: string): Promise<Category | null> {
    await initDB();
    const res = await db!.query(`SELECT * FROM categories WHERE name = ?;`, [name]);
    return res.values?.[0] as Category || null;
}

export async function getAllCategories(): Promise<Category[]> {
    await initDB();
    const res = await db!.query(`SELECT * FROM categories;`);
    return (res.values as Category[]) || [];
}

export async function deleteCategory(name: string): Promise<void> {
    await initDB();
    await db!.run(`DELETE FROM categories WHERE name = ?;`, [name]);
}

// Aggregate CRUD
export async function addOrUpdateAggregate(aggregate: Aggregate): Promise<void> {
    await initDB();
    await db!.run(
        `INSERT OR REPLACE INTO aggregates (category, period, periodStart, totalMinutes, activityCount) VALUES (?, ?, ?, ?, ?);`,
        [aggregate.category, aggregate.period, aggregate.periodStart, aggregate.totalMinutes, aggregate.activityCount]
    );
}

export async function getAggregate(category: string, period: string, periodStart: number): Promise<Aggregate | null> {
    await initDB();
    const res = await db!.query(
        `SELECT * FROM aggregates WHERE category = ? AND period = ? AND periodStart = ?;`,
        [category, period, periodStart]
    );
    return res.values?.[0] as Aggregate || null;
}

export async function getAggregatesByPeriod(period: string): Promise<Aggregate[]> {
    await initDB();
    const res = await db!.query(`SELECT * FROM aggregates WHERE period = ?;`, [period]);
    return (res.values as Aggregate[]) || [];
}

export async function getAggregatesByCategory(category: string): Promise<Aggregate[]> {
    await initDB();
    const res = await db!.query(`SELECT * FROM aggregates WHERE category = ?;`, [category]);
    return (res.values as Aggregate[]) || [];
}
