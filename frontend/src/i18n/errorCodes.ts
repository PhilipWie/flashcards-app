// Error codes the backend sends in { code, message }.
// Same list as backend/src/lib/errors.ts: keep both in sync by hand.
// de.ts and en.ts must translate every code (checked by TypeScript).
export const ERROR_CODES = [
    "INVALID_INPUT",
    "INVALID_ID",
    "UNAUTHORIZED",
    "INVALID_CREDENTIALS",
    "EMAIL_INVALID",
    "PASSWORD_INVALID",
    "EMAIL_TAKEN",
    "DECK_NAME_INVALID",
    "DECK_NOT_FOUND",
    "CARD_TEXT_EMPTY",
    "CARD_TEXT_TOO_LONG",
    "NO_CHANGES",
    "CARD_NOT_FOUND",
    "ANSWER_INVALID",
    "CHAT_INVALID",
    "AI_UNAVAILABLE",
    "TOO_MANY_REQUESTS",
    "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// the code comes from the server: only accept known values
export function isErrorCode(code: unknown): code is ErrorCode {
    return ERROR_CODES.some((known) => known === code);
}

// texts under "errors": one per code, plus the two frontend-only cases
export type ErrorTexts = Record<ErrorCode, string> & {
    // codes the frontend does not know (yet), e.g. after a backend update
    unknown: string;
    // fetch itself failed, e.g. backend not running
    network: string;
};
