import { ActivityLogItem } from "@/types";

export function groupActivitiesByDate(activities: ActivityLogItem[]) {
    const groups: { [key: string]: ActivityLogItem[] } = {};
    activities.forEach((activity) => {
        const date = new Date(activity.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        let dateKey: string;
        if (date.toDateString() === today.toDateString()) {
            dateKey = "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = "Yesterday";
        } else {
            dateKey = date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(activity);
    });
    return groups;
}
