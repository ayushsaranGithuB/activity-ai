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
    private activities: Activity[] = [];
    private categories: Category[] = [];

    // Set data from client
    setActivities(activities: Activity[]): void {
        this.activities = activities;
    }

    setCategories(categories: Category[]): void {
        this.categories = categories;
    }

    // Query methods
    queryActivities(options: QueryActivitiesOptions): Activity[] {
        let filtered = [...this.activities];

        if (options.category) {
            filtered = filtered.filter(a => a.category === options.category);
        }

        if (options.startDate) {
            filtered = filtered.filter(a => a.createdAt >= options.startDate!);
        }

        if (options.endDate) {
            filtered = filtered.filter(a => a.createdAt <= options.endDate!);
        }

        // Sort by date descending
        filtered.sort((a, b) => b.createdAt - a.createdAt);

        const offset = options.offset || 0;
        const limit = options.limit || 50;

        return filtered.slice(offset, offset + limit);
    }

    getStats(): ActivityStats {
        const timestamps = this.activities.map(a => a.createdAt);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : undefined;

        // Calculate top categories
        const categoryCounts = new Map<string, { count: number; totalMinutes: number }>();
        this.activities.forEach(activity => {
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
        this.activities.forEach(activity => {
            const category = this.categories.find(c => c.name === activity.category);
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
            totalActivities: this.activities.length,
            totalCategories: this.categories.length,
            oldestActivity: oldest,
            newestActivity: newest,
            topCategories,
            broadCategoryBreakdown,
        };
    }

    queryCategories(options: QueryCategoriesOptions): Category[] {
        let filtered = [...this.categories];

        if (options.broadCategory) {
            filtered = filtered.filter(c => c.broadCategory === options.broadCategory);
        }

        if (options.minActivities) {
            filtered = filtered.filter(c => c.activityCount >= options.minActivities!);
        }

        return filtered.sort((a, b) => b.activityCount - a.activityCount);
    }

    getTrends(options: TrendsOptions): any {
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

        const periodActivities = this.activities.filter(
            a => a.createdAt >= periodStart && a.createdAt <= periodEnd
        );

        const trendMap = new Map<string, {
            category: string;
            broadCategory: string;
            activityCount: number;
            totalMinutes: number;
        }>();

        periodActivities.forEach(activity => {
            const category = this.categories.find(c => c.name === activity.category);
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

    searchActivities(query: string, limit: number = 50): Activity[] {
        const lowerQuery = query.toLowerCase();
        return this.activities
            .filter(a =>
                a.text.toLowerCase().includes(lowerQuery) ||
                a.category.toLowerCase().includes(lowerQuery)
            )
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    getRecentActivities(limit: number = 20): Activity[] {
        return [...this.activities]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    }

    getCategoryBreakdown(options: CategoryBreakdownOptions): any[] {
        let filtered = [...this.activities];

        if (options.startDate) {
            filtered = filtered.filter(a => a.createdAt >= options.startDate!);
        }

        if (options.endDate) {
            filtered = filtered.filter(a => a.createdAt <= options.endDate!);
        }

        const totalActivities = filtered.length;
        const breakdownMap = new Map<string, {
            category: string;
            broadCategory: string;
            activityCount: number;
            totalMinutes: number;
            percentage: number;
        }>();

        filtered.forEach(activity => {
            const category = this.categories.find(c => c.name === activity.category);
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
