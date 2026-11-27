// response of POST /api/cards/:id/check (only a suggestion, the user still decides)
export type Verdict = "correct" | "partial" | "wrong";

export type CheckResult = {
    verdict: Verdict;
    // short, about the typed answer
    feedback: string;
    // a few sentences about the solution itself, can be empty
    explanation: string;
};
