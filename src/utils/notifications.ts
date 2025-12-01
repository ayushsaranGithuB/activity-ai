import { LocalNotifications, PendingResult } from "@capacitor/local-notifications";
import { NavigateFn } from '@tanstack/react-router';

// Quiet hours constants and helpers (module scope so reusable)
const QUIET_START = 23; // 11pm
const QUIET_END = 8; // 8am

function isQuietHours(d: Date) {
    const h = d.getHours();
    return h >= QUIET_START || h < QUIET_END;
}

function nextAllowedTime(d: Date) {
    if (!isQuietHours(d)) return d;
    const next = new Date(d);
    if (d.getHours() >= QUIET_START) {
        next.setDate(next.getDate() + 1);
    }
    next.setHours(QUIET_END, 0, 0, 0);
    if (next.getTime() <= d.getTime()) {
        next.setDate(next.getDate() + 1);
    }
    return next;
}

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
            let next = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
            next = nextAllowedTime(next);
            // Clear any previous app notifications so only one is visible at a time
            await clearAppNotifications();
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
    // Schedule immediately 
    const immediate = new Date(Date.now() + 1000);

    // Make sure previous app notifications are cleared so only this one shows
    await clearAppNotifications();

    await LocalNotifications.schedule({
        notifications: [{
            id: Math.floor(Math.random() * 999999) + 1, // Random ID within int range
            title: title,
            body: body,
            schedule: { at: immediate }
        }]
    });
    console.log("Notification scheduled successfully");
}

// Clear any existing pending or delivered notifications from this app
async function clearAppNotifications(): Promise<void> {
    try {
        // Cancel pending notifications
        const pending = (await LocalNotifications.getPending()) as PendingResult;
        if (pending && Array.isArray(pending.notifications) && pending.notifications.length) {
            await LocalNotifications.cancel({
                notifications: pending.notifications.map((n) => ({ id: n.id }))
            });
        }

        // Try to cancel delivered notifications as well (may not be supported on all platforms)
        const ln = LocalNotifications as unknown as { getDeliveredNotifications?: () => Promise<{ notifications: { id: number }[] }> };
        if (typeof ln.getDeliveredNotifications === 'function') {
            try {
                const delivered = await ln.getDeliveredNotifications();
                if (delivered && Array.isArray(delivered.notifications) && delivered.notifications.length) {
                    await LocalNotifications.cancel({
                        notifications: delivered.notifications.map((n) => ({ id: n.id }))
                    });
                }
            } catch (err: unknown) {
                // Non-fatal: some platforms/web fallback may not support delivered notifications removal
                console.warn('Unable to clear delivered notifications', err);
            }
        }
    } catch (e) {
        console.warn('clearAppNotifications failed', e);
    }
}

// Public wrapper so other parts of the app can clear notifications
export async function clearAllNotifications(): Promise<void> {
    await clearAppNotifications();
}