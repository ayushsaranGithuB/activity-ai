import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { CATEGORY_MAPPINGS } from '../lib/category-guidance';

let sqlite: SQLiteConnection;
export let db: SQLiteDBConnection;
export { sqlite };

export async function initDB() {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database initialization skipped - not running in Capacitor environment");
        return;
    }

    sqlite = new SQLiteConnection(CapacitorSQLite);
    db = await sqlite.createConnection('activity-ai', false, 'no-encryption', 1, false);
    await db.open();

    // Run initial schema
    const schema = `
-- Initial schema for Activity AI v2
-- Tables: messages, activities, categories, schema_meta

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL, -- 'user' or 'agent'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  category_id INTEGER,
  length_mins INTEGER, -- Duration of the activity in minutes
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
    icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schema_meta (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial version
INSERT OR IGNORE INTO schema_meta (version) VALUES (1);
`;
    await db.execute(schema);

    // Insert initial categories from CATEGORY_MAPPINGS (include suggested icons)
    try {
        // dynamic import to avoid circular issues
        const { suggestIconForName } = await import('../lib/iconSuggestions');
        for (const mapping of CATEGORY_MAPPINGS) {
            const suggested = suggestIconForName(mapping.name);
            await db.run(
                'INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)',
                [mapping.name, mapping.description, suggested]
            );
        }
    } catch (e) {
        // fallback if suggestion import fails
        for (const mapping of CATEGORY_MAPPINGS) {
            await db.run(
                'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
                [mapping.name, mapping.description]
            );
            console.warn('Failed to suggest icons for initial categories:', e);
        }
    }

    // Migration: Add length_mins column if it doesn't exist
    try {
        const columns = await db.query("PRAGMA table_info(activities)");
        const hasLengthMins = columns.values?.some((col: { name: string }) => col.name === 'length_mins');
        if (!hasLengthMins) {
            await db.run("ALTER TABLE activities ADD COLUMN length_mins INTEGER DEFAULT 30");
            console.log("Migration: Added length_mins column to activities table");
        }
    } catch (error) {
        console.error("Migration failed:", error);
    }

    // Migration: Add sub_category column if it doesn't exist (v2)
    try {
        const columns = await db.query("PRAGMA table_info(activities)");
        const hasSubCategory = columns.values?.some((col: { name: string }) => col.name === 'sub_category');
        if (!hasSubCategory) {
            await db.run("ALTER TABLE activities ADD COLUMN sub_category TEXT");
            console.log("Migration: Added sub_category column to activities table");
        }
    } catch (error) {
        console.error("Migration failed:", error);
    }
}