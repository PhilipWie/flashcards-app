// Pure helpers for GET /api/stats (no database, easy to test).
// Days are "YYYY-MM-DD" strings in the STATS_TIME_ZONE.

// Calendar days are counted in German time: an answer at 00:30 belongs to the new day.
// (The database runs in UTC, so this cannot use CURRENT_DATE.)
export const STATS_TIME_ZONE = 'Europe/Berlin';

// number of days in the "answers per day" chart, including today
export const STATS_DAYS = 14;

export type DayCount = { date: string; correct: number; wrong: number };

// today as "YYYY-MM-DD" in the given time zone (en-CA formats dates as YYYY-MM-DD)
export function todayIn(timeZone: string, now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// calendar arithmetic in UTC, so daylight saving time cannot shift the day
export function addDays(day: string, amount: number): string {
    const [year, month, date] = day.split('-').map(Number);
    return new Date(Date.UTC(year!, month! - 1, date! + amount)).toISOString().slice(0, 10);
}

// Consecutive days with at least one answer, ending today.
// If nothing was answered today yet, the streak still counts up to yesterday,
// so it does not drop to 0 in the morning.
export function calcStreak(activeDays: Iterable<string>, today: string): number {
    const days = new Set(activeDays);
    let day = days.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (days.has(day)) {
        streak++;
        day = addDays(day, -1);
    }
    return streak;
}

// share of correct answers in percent (rounded), null without any answer
export function calcAccuracy(correct: number, total: number): number | null {
    if (total <= 0) return null;
    return Math.round((correct / total) * 100);
}

// the last `count` days up to today, oldest first, days without answers as 0
export function lastDays(rows: DayCount[], today: string, count: number): DayCount[] {
    const byDate = new Map(rows.map((row) => [row.date, row]));
    const result: DayCount[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const date = addDays(today, -i);
        result.push(byDate.get(date) ?? { date, correct: 0, wrong: 0 });
    }
    return result;
}
