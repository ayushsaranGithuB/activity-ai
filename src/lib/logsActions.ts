// Returns the timestamp of the most recent activity, or null if none
export async function getLastActivityTimestamp(): Promise<Date | null> {
    const activities = await fetchActivities();
    if (!activities.length) return null;
    // Assume activities are sorted by timestamp DESC
    const latest = activities[0];
    return latest.timestamp ? new Date(latest.timestamp) : null;
}
import { Capacitor } from "@capacitor/core";
import { dbQuery } from "@/agent/tools";
import { initDB } from "@/db/initialize";
import { sample_activities } from "@/db/dummyData/sample-activities";
import { ActivityLogItem } from "@/types";

export async function fetchActivities(): Promise<ActivityLogItem[]> {
    if (Capacitor.isNativePlatform()) {
        // Ensure DB initialized in case UI called this before app-level init completed
        try {
            await initDB();
        } catch (e) {
            console.warn('initDB() failed or already initialized:', e);
        }
        try {
            const rows = await dbQuery(
                `SELECT a.id, a.description, a.category_id, a.length_mins, a.sub_category, a.timestamp, c.name as category 
                 FROM activities a
                 LEFT JOIN categories c ON a.category_id = c.id
                 ORDER BY a.timestamp DESC`
            );
            return rows?.map((a: ActivityLogItem) => ({
                id: a.id,
                description: a.description,
                category_id: a.category_id,
                length_mins: a.length_mins,
                sub_category: a.sub_category,
                timestamp: a.timestamp,
                category: a.category || undefined,
            })) || [];
        } catch (err) {
            console.error("Failed to fetch activities from SQLite:", err);
            return [];
        }
    } else {
        return [...sample_activities];
    }
}

interface UpdateActivityOptions {
    description?: string;
    timestamp?: string;
    length_mins?: number | null | undefined;
    category_id?: number | undefined | null;
}

export async function updateActivity(id: number, updates: UpdateActivityOptions) {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (updates.description !== undefined) {
        sets.push('description = ?');
        params.push(updates.description);
    }

    if (updates.timestamp !== undefined) {
        sets.push('timestamp = ?');
        params.push(updates.timestamp);
    }

    if (updates.length_mins !== undefined && updates.length_mins !== null) {
        sets.push('length_mins = ?');
        params.push(updates.length_mins);
    }

    if (updates.category_id !== undefined) {
        sets.push('category_id = ?');
        params.push(updates.category_id);
    }

    if (sets.length === 0) return;

    const sql = `UPDATE activities SET ${sets.join(', ')} WHERE id = ?`;
    params.push(id);
    await dbQuery(sql, params);
}

export async function deleteActivity(id: number) {
    await dbQuery(
        `DELETE FROM activities WHERE id = ?`,
        [id]
    );
}
