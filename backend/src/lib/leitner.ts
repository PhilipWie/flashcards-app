// Leitner system: 5 boxes, interval in days until the next review
// Box 1: same day, Box 2: 2 days, Box 3: 4 days, Box 4: 8 days, Box 5: 16 days (learned)
// Box 1 is only reached by new cards and wrong answers: those stay due today,
// so they can be repeated right away instead of tomorrow.
export const INTERVAL_DAYS = [0, 2, 4, 8, 16] as const;
export const MAX_BOX = INTERVAL_DAYS.length;

export type LeitnerResult = {
    box: number;
    days: number; // days from today until next_review
};

// Calculates new box and interval after an answer
// correct: one box up (max. MAX_BOX), wrong: back to box 1
export function nextLeitner(currentBox: number, correct: boolean): LeitnerResult {
    const box = correct ? Math.min(currentBox + 1, MAX_BOX) : 1;
    return { box, days: INTERVAL_DAYS[box - 1]! };
}
