import { LocalNotifications } from "@capacitor/local-notifications";
import { NavigateFn } from '@tanstack/react-router';

// Pass the navigate function from TanStack Router
export async function setupNotifications(navigate: NavigateFn, getLastActivityTimestamp?: () => Promise<Date | null>) {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") {
        console.log("Notifications permission not granted");
        return;
    }

    // Schedule fixed notifications (morning, afternoon, evening)
    await LocalNotifications.schedule({
        notifications: [
            {
                id: 101,
                title: "Morning check-in",
                body: "Good Morning! How did you sleep?",
                schedule: {
                    repeats: true,
                    every: 'day',
                    on: { hour: 8, minute: 0 }
                }
            },
            {
                id: 102,
                title: "Afternoon check-in",
                body: "Good Afternoon! How's the day going?",
                schedule: {
                    repeats: true,
                    every: 'day',
                    on: { hour: 13, minute: 0 }
                }
            },
            {
                id: 103,
                title: "Evening check-in",
                body: "Good Evening! What did you get up to today?",
                schedule: {
                    repeats: true,
                    every: 'day',
                    on: { hour: 20, minute: 0 }
                }
            }
        ]
    });

    // Dynamic notification: only fire if no activity in last 90 mins
    const scheduleDynamicNotification = async () => {
        if (!getLastActivityTimestamp) return;
        const lastActivity = await getLastActivityTimestamp();
        const now = new Date();
        let shouldSchedule = false;
        if (!lastActivity) {
            shouldSchedule = true;
        } else {
            const diffMs = now.getTime() - lastActivity.getTime();
            const diffMins = diffMs / (1000 * 60);
            if (diffMins >= 90) {
                shouldSchedule = true;
            }
        }
        if (shouldSchedule) {
            const next = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
            await LocalNotifications.schedule({
                notifications: [{
                    id: 201,
                    title: "Quick check-in",
                    body: "What are you up to?",
                    schedule: { at: next }
                }]
            });
        }
    };

    // Call on app start and optionally on interval
    await scheduleDynamicNotification();
    // Optionally, setInterval to check every X minutes
    setInterval(scheduleDynamicNotification, 30 * 60 * 1000); // every 30 mins

    LocalNotifications.addListener('localNotificationActionPerformed', () => {
        if (navigate) navigate({ to: '/' });
    });
}

// Utility to send a one-off notification
export async function sendNotification(
    title: string = "Activity AI",
    body: string
) {
    console.log("Sending notification:", title, body);
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") {
        console.log("Notifications permission not granted");
        return;
    }
    await LocalNotifications.schedule({
        notifications: [{
            id: Math.floor(Math.random() * 999999) + 1, // Random ID within int range
            title: title,
            body: body,
            schedule: { at: new Date(Date.now() + 1000) } // 1 second later
        }]
    });
    console.log("Notification scheduled successfully");
}