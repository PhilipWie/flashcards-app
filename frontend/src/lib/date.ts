// The backend sends dates as "YYYY-MM-DD" (next_review).
// Strings in this format can be compared directly: "2026-11-27" < "2026-12-01".

// today in the local time zone as "YYYY-MM-DD"
export function todayIso(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

export function isDue(nextReview: string): boolean {
    return nextReview <= todayIso();
}

// "2026-12-01" -> "01.12.2026" (de) or "12/01/2026" (en), locale = current UI language
// not new Date("2026-12-01"): that is parsed as UTC and can show the previous day
export function formatDate(iso: string, locale: string): string {
    const [year, month, day] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(year, month - 1, day),
    );
}
