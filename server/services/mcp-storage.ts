import { db, activities as activitiesTable, categories as categoriesTable } from '../../src/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';
/**
 * MCP Storage Service
 * Provides access to IndexedDB data for MCP queries
 * Since this runs on the server, we'll use the API endpoints to query data
 */

export interface Activity {
    id: number;
    text: string;
    category: string;
    createdAt: number;
}

export interface Category {
    name: string;
    description?: string;
    broadCategory?: string;
    totalMinutes: number;
    activityCount: number;
    createdAt: number;
    lastUsedAt: number;
}

export interface ActivityStats {
    totalActivities: number;
    totalCategories: number;
    oldestActivity?: number;
    newestActivity?: number;
    topCategories: Array<{
        category: string;
        count: number;
        totalMinutes: number;
    }>;
    broadCategoryBreakdown: Array<{
        broadCategory: string;
        count: number;
        totalMinutes: number;
    }>;
}

export interface QueryActivitiesOptions {
    category?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
}

export interface QueryCategoriesOptions {
    broadCategory?: string;
    minActivities?: number;
}

export interface TrendsOptions {
    period: "week" | "month" | "year";
    startDate?: number;
}

export interface CategoryBreakdownOptions {
    startDate?: number;
    endDate?: number;
}

/**
 * In-memory storage for MCP queries
 * This should be populated by the client or synced periodically
 */
class MCPStorage {
    // All data is now loaded from SQLite via Drizzle ORM

    // Query methods
    async queryActivities(options: QueryActivitiesOptions): Promise<Activity[]> {
        let whereClauses = [];
        if (options.category) whereClauses.push(eq(activitiesTable.category, options.category));
        if (options.startDate) whereClauses.push(gte(activitiesTable.createdAt, options.startDate));
        if (options.endDate) whereClauses.push(lte(activitiesTable.createdAt, options.endDate));
        const where = whereClauses.length ? and(...whereClauses) : undefined;
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        const result = await db.select().from(activitiesTable).where(where).orderBy(activitiesTable.createdAt).limit(limit).offset(offset);
        return result;
    }

    async getStats(): Promise<ActivityStats> {
        const activities = await db.select().from(activitiesTable);
        const categories = await db.select().from(categoriesTable);
        const timestamps = activities.map(a => a.createdAt);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : undefined;

        // Calculate top categories
        const categoryCounts = new Map<string, { count: number; totalMinutes: number }>();
        activities.forEach(activity => {
            const current = categoryCounts.get(activity.category) || { count: 0, totalMinutes: 0 };
            categoryCounts.set(activity.category, {
                count: current.count + 1,
                totalMinutes: current.totalMinutes + 5, // Assuming 5 min per activity
            });
        });

        const topCategories = Array.from(categoryCounts.entries())
            .map(([category, data]) => ({ category, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate broad category breakdown
        const broadCounts = new Map<string, { count: number; totalMinutes: number }>();
        activities.forEach(activity => {
            const category = categories.find(c => c.name === activity.category);
            const broad = category?.broadCategory || "Other";
            const current = broadCounts.get(broad) || { count: 0, totalMinutes: 0 };
            broadCounts.set(broad, {
                count: current.count + 1,
                totalMinutes: current.totalMinutes + 5,
            });
        });

        const broadCategoryBreakdown = Array.from(broadCounts.entries())
            .map(([broadCategory, data]) => ({ broadCategory, ...data }))
            .sort((a, b) => b.count - a.count);

        return {
            totalActivities: activities.length,
            totalCategories: categories.length,
            oldestActivity: oldest,
            newestActivity: newest,
            topCategories,
            broadCategoryBreakdown,
        };
    }

    async queryCategories(options: QueryCategoriesOptions): Promise<Category[]> {
        let whereClauses = [];
        if (options.broadCategory) whereClauses.push(eq(categoriesTable.broadCategory, options.broadCategory));
        if (options.minActivities) whereClauses.push(gte(categoriesTable.activityCount, options.minActivities));
        const where = whereClauses.length ? and(...whereClauses) : undefined;
        const result = await db.select().from(categoriesTable).where(where).orderBy(categoriesTable.activityCount);
        return result;
    }

    async getTrends(options: TrendsOptions): Promise<any> {
        const now = options.startDate || Date.now();
        let periodStart: number;
        let periodEnd: number;

        switch (options.period) {
            case "week":
                periodEnd = now;
                periodStart = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                periodEnd = now;
                periodStart = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                periodEnd = now;
                periodStart = now - 365 * 24 * 60 * 60 * 1000;
                break;
        }

        const periodActivities = await db.select().from(activitiesTable).where(and(gte(activitiesTable.createdAt, periodStart), lte(activitiesTable.createdAt, periodEnd)));
        const categories = await db.select().from(categoriesTable);

        const trendMap = new Map<string, {
            category: string;
            broadCategory: string;
            activityCount: number;
            totalMinutes: number;
        }>();

        periodActivities.forEach(activity => {
            const category = categories.find(c => c.name === activity.category);
            const broad = category?.broadCategory || "Other";
            const key = activity.category;

            const current = trendMap.get(key) || {
                category: activity.category,
                broadCategory: broad,
                activityCount: 0,
                totalMinutes: 0,
            };

            trendMap.set(key, {
                ...current,
                activityCount: current.activityCount + 1,
                totalMinutes: current.totalMinutes + 5,
            });
        });

        const trends = Array.from(trendMap.values())
            .sort((a, b) => b.activityCount - a.activityCount);

        return {
            period: options.period,
            periodStart,
            periodEnd,
            trends,
        };
    }

    async searchActivities(query: string, limit: number = 50): Promise<Activity[]> {
        const lowerQuery = query.toLowerCase();
        const result = await db.select().from(activitiesTable);
        return result
            .filter(a =>
                a.text.toLowerCase().includes(lowerQuery) ||
                a.category.toLowerCase().includes(lowerQuery)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    async getRecentActivities(limit: number = 20): Promise<Activity[]> {
        const result = await db.select().from(activitiesTable);
        return result
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    async getCategoryBreakdown(options: CategoryBreakdownOptions): Promise<any[]> {
        let activities = await db.select().from(activitiesTable);
        if (options.startDate) {
            activities = activities.filter(a => a.createdAt >= options.startDate!);
        }
        if (options.endDate) {
            activities = activities.filter(a => a.createdAt <= options.endDate!);
        }
        const categories = await db.select().from(categoriesTable);
        const totalActivities = activities.length;
        const breakdownMap = new Map<string, {
            category: string;
            broadCategory: string;
            activityCount: number;
            totalMinutes: number;
            percentage: number;
        }>();
        activities.forEach(activity => {
            const category = categories.find(c => c.name === activity.category);
            const broad = category?.broadCategory || "Other";
            const current = breakdownMap.get(activity.category) || {
                category: activity.category,
                broadCategory: broad,
                activityCount: 0,
                totalMinutes: 0,
                percentage: 0,
            };
            breakdownMap.set(activity.category, {
                ...current,
                activityCount: current.activityCount + 1,
                totalMinutes: current.totalMinutes + 5,
            });
        });
        return Array.from(breakdownMap.values())
            .map(item => ({
                ...item,
                percentage: totalActivities > 0 ? (item.activityCount / totalActivities) * 100 : 0,
            }))
            .sort((a, b) => b.activityCount - a.activityCount);
    }
}

export const mcpStorage = new MCPStorage();
