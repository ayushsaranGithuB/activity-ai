import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

let sqlite: SQLiteConnection;
let db: SQLiteDBConnection;

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
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
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
}

export async function dbInsert(table: string, data: Record<string, unknown>) {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return { success: false, error: "Not in Capacitor environment" };
    }
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    // Run the insert
    await db.run(sql, values);

    // Try to get the last inserted row id from the connection
    try {
        const res = await db.query('SELECT last_insert_rowid() as id');
        const id = res.values?.[0]?.id;
        return { success: true, id };
    } catch (e) {
        return { success: true };
    }
}

export async function dbQuery(sql: string, params?: unknown[]) {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return [];
    }
    const result = await db.query(sql, params || []);
    return result.values;
}

export async function dbUpdate(table: string, data: Record<string, unknown>, where: Record<string, unknown>) {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return { success: false, error: "Not in Capacitor environment" };
    }
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const values = [...Object.values(data), ...Object.values(where)];
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    await db.run(sql, values);
    return { success: true };
}

export async function dbEnsureSchema() {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return { version: 0, error: "Not in Capacitor environment" };
    }
    // Check current version
    const versionResult = await db.query('SELECT MAX(version) as version FROM schema_meta');
    const currentVersion = versionResult.values?.[0]?.version || 0;

    // For now, assume version 1 is latest
    if (currentVersion < 1) {
        // Apply migrations
        // TODO: Implement migration logic
    }
    return { version: 1 };
}

export async function trendCompute(period: 'day' | 'week' | 'month' | 'year') {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return [];
    }
    // Implement trend computation logic
    // For example, count activities per category in the period
    const sql = `
    SELECT c.name, COUNT(a.id) as count
    FROM activities a
    JOIN categories c ON a.category_id = c.id
    WHERE a.timestamp >= datetime('now', '-1 ${period}')
    GROUP BY c.id
  `;
    const result = await db.query(sql);
    return result.values;
}

export async function backupCreate() {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return { error: "Not in Capacitor environment" };
    }
    const exportResult = await db.exportToJson('full');
    const backupData = JSON.stringify(exportResult);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    await Filesystem.writeFile({
        path: `backups/${filename}`,
        data: backupData,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
    });
    return { filename };
}

export async function backupRestore(filename: string) {
    if (!Capacitor.isNativePlatform()) {
        console.warn("Database operations not available in browser environment");
        return { error: "Not in Capacitor environment" };
    }
    const backupFile = await Filesystem.readFile({
        path: `backups/${filename}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
    });
    const backupData = JSON.parse(backupFile.data as string);
    await sqlite.importFromJson(backupData);
    return { success: true };
} export const toolDefinitions = [
    {
        name: 'dbInsert',
        description: 'Insert data into a table',
        parameters: {
            type: 'object',
            properties: {
                table: { type: 'string' },
                data: { type: 'object' },
            },
            required: ['table', 'data'],
        },
    },
    {
        name: 'dbQuery',
        description: 'Query the database',
        parameters: {
            type: 'object',
            properties: {
                sql: { type: 'string' },
                params: { type: 'array', items: { type: 'any' } },
            },
            required: ['sql'],
        },
    },
    {
        name: 'dbUpdate',
        description: 'Update data in a table',
        parameters: {
            type: 'object',
            properties: {
                table: { type: 'string' },
                data: { type: 'object' },
                where: { type: 'object' },
            },
            required: ['table', 'data', 'where'],
        },
    },
    {
        name: 'dbEnsureSchema',
        description: 'Ensure database schema is up to date',
        parameters: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'trendCompute',
        description: 'Compute trends for a period',
        parameters: {
            type: 'object',
            properties: {
                period: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
            },
            required: ['period'],
        },
    },
    {
        name: 'backupCreate',
        description: 'Create a backup of the database',
        parameters: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'backupRestore',
        description: 'Restore from a backup',
        parameters: {
            type: 'object',
            properties: {
                filename: { type: 'string' },
            },
            required: ['filename'],
        },
    },
];