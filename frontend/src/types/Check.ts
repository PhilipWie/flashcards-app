// response of POST /api/cards/:id/check (only a suggestion, the user still decides)
export type Verdict = "correct" | "partial" | "wrong";

export type CheckResult = {
    verdict: Verdict;
    feedback: string;
};
