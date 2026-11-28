import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, isDue, todayIso } from "./date";

describe("date helpers", () => {
    beforeEach(() => {
        // fixed "today", otherwise the result depends on the day the test runs
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 10, 27, 12, 0)); // 27.11.2026, local time
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("todayIso uses the local date as YYYY-MM-DD", () => {
        expect(todayIso()).toBe("2026-11-27");
    });

    it("isDue is true for today and earlier", () => {
        expect(isDue("2026-11-26")).toBe(true);
        expect(isDue("2026-11-27")).toBe(true);
        expect(isDue("2026-11-28")).toBe(false);
    });

    it("formatDate uses the format of the language without shifting the day", () => {
        expect(formatDate("2026-12-01", "de")).toBe("01.12.2026");
        expect(formatDate("2026-12-01", "en")).toBe("12/01/2026");
    });
});
