/**
 * Get date range with offset for a given period
 * @param period - The time period (week, month, or year)
 * @param offset - The offset from current period (0 = current, -1 = previous, 1 = next)
 * @returns Object with start and end timestamps
 */
export function getOffsetPeriodRange(
    period: "week" | "month" | "year",
    offset: number
): { start: number; end: number } {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === "week") {
        // Week starts on Sunday
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek + offset * 7);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (period === "month") {
        start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        end.setHours(23, 59, 59, 999);
    } else {
        // year
        start = new Date(now.getFullYear() + offset, 0, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear() + offset, 11, 31);
        end.setHours(23, 59, 59, 999);
    }

    return {
        start: start.getTime(),
        end: end.getTime(),
    };
}

/**
 * Format a period label for display
 * @param period - The time period (week, month, or year)
 * @param offset - The offset from current period
 * @returns Formatted string for display
 */
export function formatPeriodLabel(
    period: "week" | "month" | "year",
    offset: number
): string {
    const range = getOffsetPeriodRange(period, offset);
    const start = new Date(range.start);
    const end = new Date(range.end);

    if (offset === 0) {
        if (period === "week") return "This Week";
        if (period === "month") return "This Month";
        if (period === "year") return "This Year";
    }

    if (period === "week") {
        const monthStart = start.toLocaleDateString("en-US", { month: "short" });
        const monthEnd = end.toLocaleDateString("en-US", { month: "short" });
        const dateStart = start.getDate();
        const dateEnd = end.getDate();

        if (monthStart === monthEnd) {
            return `${monthStart} ${dateStart}-${dateEnd}`;
        } else {
            return `${monthStart} ${dateStart} - ${monthEnd} ${dateEnd}`;
        }
    } else if (period === "month") {
        return start.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    } else {
        return start.getFullYear().toString();
    }
}
