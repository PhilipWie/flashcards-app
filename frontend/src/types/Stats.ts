// answers on one calendar day ("YYYY-MM-DD")
export type DayCount = {
    date: string;
    correct: number;
    wrong: number;
};

// response of GET /api/stats
export type Stats = {
    today: string;
    // consecutive days with at least one answer (up to today or yesterday)
    streak: number;
    // accuracy in percent, null without any answer
    total: { answers: number; correct: number; accuracy: number | null };
    period: { days: number; answers: number; correct: number; accuracy: number | null };
    // the last `period.days` days, oldest first
    days: DayCount[];
    // boxes: index 0 = box 1
    cards: { total: number; due: number; learned: number; boxes: number[] };
};
