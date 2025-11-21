import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

import { sqliteTable, integer, text, real, blob } from 'drizzle-orm/sqlite-core';
import type { Activity, Category, Aggregate } from '../types';

// Activities table
export const activities = sqliteTable('activities', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    text: text('text').notNull(),
    category: text('category').notNull(),
    createdAt: integer('createdAt').notNull(),
    meta: blob('meta'), // Store ActivityMeta as JSON string or blob
});

// Categories table
export const categories = sqliteTable('categories', {
    name: text('name').primaryKey(),
    description: text('description'),
    broadCategory: text('broadCategory'),
    isBroadCategory: integer('isBroadCategory'), // 0/1 boolean
    totalMinutes: integer('totalMinutes').notNull(),
    activityCount: integer('activityCount').notNull(),
    createdAt: integer('createdAt').notNull(),
    lastUsedAt: integer('lastUsedAt').notNull(),
});

// Aggregates table
export const aggregates = sqliteTable('aggregates', {
    category: text('category').notNull(),
    period: text('period').notNull(),
    periodStart: integer('periodStart').notNull(),
    totalMinutes: integer('totalMinutes').notNull(),
    activityCount: integer('activityCount').notNull(),
});

// Create or open the SQLite database file
const sqlite = new Database('activity-ai.sqlite');

// Initialize Drizzle ORM
export const db = drizzle(sqlite);
