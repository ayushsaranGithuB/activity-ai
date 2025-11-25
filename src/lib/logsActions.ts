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
import { sample_activities } from "@/db/dummyData/sample-activities";
import { ActivityLogItem } from "@/types";

export async function fetchActivities(): Promise<ActivityLogItem[]> {
    if (Capacitor.isNativePlatform()) {
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

export async function updateActivity(id: number, description: string, timestamp: string, length_mins?: number) {
    if (length_mins != null) {
        await dbQuery(
            `UPDATE activities SET description = ?, timestamp = ?, length_mins = ? WHERE id = ?`,
            [description, timestamp, length_mins, id]
        );
    } else {
        await dbQuery(
            `UPDATE activities SET description = ?, timestamp = ? WHERE id = ?`,
            [description, timestamp, id]
        );
    }
}

export async function deleteActivity(id: number) {
    await dbQuery(
        `DELETE FROM activities WHERE id = ?`,
        [id]
    );
}
