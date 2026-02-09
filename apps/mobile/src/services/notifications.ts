import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import {
    loadScheduledNotificationIds,
    saveScheduledNotificationIds,
} from "@/data/localStore";

function formatLeadLabel(minutes: number): string {
    if (minutes % 1440 === 0) {
        const days = minutes / 1440;
        return days === 1 ? "1 day" : `${days} days`;
    }
    if (minutes % 60 === 0) {
        const hours = minutes / 60;
        return hours === 1 ? "1 hour" : `${hours} hours`;
    }
    return `${minutes} minutes`;
}

export async function openSystemNotificationSettings(): Promise<void> {
    await Linking.openSettings();
}

export async function ensureParkingNotificationPermissions(): Promise<boolean> {
    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.granted) return true;

    const status = permissions.ios?.status;
    const provisional =
        status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (provisional) return true;

    // Request only when not explicitly denied already.
    if (permissions.canAskAgain) {
        const requested = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });
        if (requested.granted) return true;
        const requestedStatus = requested.ios?.status;
        if (
            requestedStatus ===
                Notifications.IosAuthorizationStatus.PROVISIONAL
        ) {
            return true;
        }
    }

    return false;
}

export async function cancelScheduledParkingNotifications(): Promise<void> {
    const ids = await loadScheduledNotificationIds();
    if (ids.length > 0) {
        await Promise.all(
            ids.map(async (id) => {
                try {
                    await Notifications.cancelScheduledNotificationAsync(id);
                } catch {
                    // Ignore stale IDs.
                }
            }),
        );
    }
    await saveScheduledNotificationIds([]);
}

interface ScheduleParkingNotificationsParams {
    streetName: string;
    sweepStartTime: Date;
    leadMinutesSet: number[];
}

export async function scheduleParkingNotifications({
    streetName,
    sweepStartTime,
    leadMinutesSet,
}: ScheduleParkingNotificationsParams): Promise<number> {
    if (Platform.OS !== "ios") return 0;

    await cancelScheduledParkingNotifications();

    const sortedLeads = Array.from(
        new Set(leadMinutesSet.filter((value) => value > 0)),
    ).sort((a, b) => b - a);

    const now = Date.now();
    const scheduledIds: string[] = [];

    for (const leadMinutes of sortedLeads) {
        const triggerAt = sweepStartTime.getTime() - leadMinutes * 60 * 1000;
        if (triggerAt <= now + 30_000) continue;

        const trigger: Notifications.DateTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerAt),
        };
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Street Sweeping Reminder",
                body: `${streetName}: move your car in ${formatLeadLabel(
                    leadMinutes,
                )}.`,
                sound: "default",
                data: {
                    streetName,
                    sweepStartTime: sweepStartTime.toISOString(),
                    leadMinutes,
                },
            },
            trigger,
        });
        scheduledIds.push(id);
    }

    await saveScheduledNotificationIds(scheduledIds);
    return scheduledIds.length;
}
