import { describe, expect, it } from 'vitest';
import { addDays, calcAccuracy, calcStreak, lastDays, todayIn } from './stats.js';

describe('todayIn', () => {
    it('uses the calendar day of the time zone, not UTC', () => {
        // 23:30 UTC on Nov 27 is already Nov 28 in Berlin (UTC+1)
        const now = new Date('2026-11-27T23:30:00Z');
        expect(todayIn('UTC', now)).toBe('2026-11-27');
        expect(todayIn('Europe/Berlin', now)).toBe('2026-11-28');
    });
});

describe('addDays', () => {
    it('crosses month and year boundaries', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('is not affected by daylight saving time', () => {
        expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
        expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    });
});

describe('calcStreak', () => {
    const today = '2026-11-27';

    it('is 0 without answers', () => {
        expect(calcStreak([], today)).toBe(0);
    });

    it('counts consecutive days up to today', () => {
        expect(calcStreak(['2026-11-27', '2026-11-26', '2026-11-25'], today)).toBe(3);
    });

    it('keeps the streak if today has no answer yet', () => {
        expect(calcStreak(['2026-11-26', '2026-11-25'], today)).toBe(2);
    });

    it('stops at the first gap', () => {
        expect(calcStreak(['2026-11-27', '2026-11-26', '2026-11-24'], today)).toBe(2);
    });

    it('is 0 if the last answer is older than yesterday', () => {
        expect(calcStreak(['2026-11-25'], today)).toBe(0);
    });
});

describe('calcAccuracy', () => {
    it('returns rounded percent', () => {
        expect(calcAccuracy(2, 3)).toBe(67);
        expect(calcAccuracy(5, 5)).toBe(100);
    });

    it('returns null without answers', () => {
        expect(calcAccuracy(0, 0)).toBeNull();
    });
});

describe('lastDays', () => {
    it('fills missing days with 0, oldest first', () => {
        const rows = [{ date: '2026-11-26', correct: 3, wrong: 1 }];
        expect(lastDays(rows, '2026-11-27', 3)).toEqual([
            { date: '2026-11-25', correct: 0, wrong: 0 },
            { date: '2026-11-26', correct: 3, wrong: 1 },
            { date: '2026-11-27', correct: 0, wrong: 0 },
        ]);
    });
});
