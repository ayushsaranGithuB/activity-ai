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
import { sample_activities } from "@/components/dummyData/sample-activities";
import { ActivityLogItem } from "@/types";

export async function fetchActivities(): Promise<ActivityLogItem[]> {
    if (Capacitor.isNativePlatform()) {
        try {
            const rows = await dbQuery(
                "SELECT id, description, category_id, timestamp FROM activities ORDER BY timestamp DESC"
            );
            return rows.map((a: ActivityLogItem) => ({
                id: a.id,
                description: a.description,
                category_id: a.category_id,
                timestamp: a.timestamp,
                category: undefined,
            }));
        } catch (err) {
            console.error("Failed to fetch activities from SQLite:", err);
            return [];
        }
    } else {
        return [...sample_activities];
    }
}

export async function updateActivity(id: number, description: string, timestamp: string) {
    await dbQuery(
        `UPDATE activities SET description = ?, timestamp = ? WHERE id = ?`,
        [description, timestamp, id]
    );
}

export async function deleteActivity(id: number) {
    await dbQuery(
        `DELETE FROM activities WHERE id = ?`,
        [id]
    );
}
