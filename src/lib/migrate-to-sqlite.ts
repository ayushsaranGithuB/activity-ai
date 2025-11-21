

/** @typedef {import('../types').Activity} Activity */
/** @typedef {import('../types').Category} Category */
/** @typedef {import('../types').Aggregate} Aggregate */

/**
 * Import backup JSON data into SQLite via Drizzle ORM
 * @param backupPath Path to the backup JSON file
 */


async function migrateBackupToSQLite(backupPath) {
    const fs = await import('fs');
    const { db, activities, categories, aggregates } = await import('./db.ts');
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const backup = JSON.parse(raw);

    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        category TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        meta BLOB
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY,
        description TEXT,
        broadCategory TEXT,
        isBroadCategory INTEGER,
        totalMinutes INTEGER NOT NULL,
        activityCount INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        lastUsedAt INTEGER NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS aggregates (
        category TEXT NOT NULL,
        period TEXT NOT NULL,
        periodStart INTEGER NOT NULL,
        totalMinutes INTEGER NOT NULL,
        activityCount INTEGER NOT NULL
    )`);

    // Insert activities
    if (Array.isArray(backup.activities)) {
        for (const activity of backup.activities) {
            await db.insert(activities).values({
                id: activity.id,
                text: activity.text,
                category: activity.category,
                createdAt: activity.createdAt,
                meta: activity.meta ? Buffer.from(JSON.stringify(activity.meta)) : null,
            });
        }
    }

    // Insert categories
    if (Array.isArray(backup.categories)) {
        for (const category of backup.categories) {
            await db.insert(categories).values({
                name: category.name,
                description: category.description ?? null,
                broadCategory: category.broadCategory ?? null,
                isBroadCategory: category.isBroadCategory ? 1 : 0,
                totalMinutes: category.totalMinutes,
                activityCount: category.activityCount,
                createdAt: category.createdAt ?? Date.now(),
                lastUsedAt: category.lastUsedAt ?? Date.now(),
            });
        }
    }

    // Insert aggregates
    if (Array.isArray(backup.aggregates)) {
        for (const aggregate of backup.aggregates) {
            await db.insert(aggregates).values({
                category: aggregate.category,
                period: aggregate.period,
                periodStart: aggregate.periodStart,
                totalMinutes: aggregate.totalMinutes,
                activityCount: aggregate.activityCount,
            });
        }
    }

    console.log('✅ Migration to SQLite complete!');
}

// CLI entry point

if (typeof process !== 'undefined' && process.argv) {
    const backupPath = process.argv[2];
    if (backupPath) {
        migrateBackupToSQLite(backupPath);
    }
}
