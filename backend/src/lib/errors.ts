// Machine-readable error codes. Every error response is { code, message }:
// the frontend translates the code, message is English text for developers and logs.
// Keep in sync with frontend/src/i18n/errorCodes.ts and docs/technical_docu/api.md.
export const ERROR_CODES = [
    // body missing, not an object, or a field has the wrong type
    'INVALID_INPUT',
    // id in the URL is not a positive integer
    'INVALID_ID',
    'UNAUTHORIZED',
    // refresh cookie missing, expired, revoked or reused: log in again
    'SESSION_EXPIRED',
    // cookie route called from another origin or without the custom header (CSRF)
    'FORBIDDEN_ORIGIN',
    // login: email or password wrong (on purpose not more specific)
    'INVALID_CREDENTIALS',
    'EMAIL_INVALID',
    'PASSWORD_INVALID',
    'EMAIL_TAKEN',
    'DECK_NAME_INVALID',
    'DECK_NOT_FOUND',
    'CARD_TEXT_EMPTY',
    'CARD_TEXT_TOO_LONG',
    'NO_CHANGES',
    'CARD_NOT_FOUND',
    'ANSWER_INVALID',
    'CHAT_INVALID',
    'AI_UNAVAILABLE',
    'TOO_MANY_REQUESTS',
    'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ErrorBody = { code: ErrorCode; message: string };

// body of an error response, e.g. res.status(404).json(apiError('DECK_NOT_FOUND', 'Deck not found'))
export function apiError(code: ErrorCode, message: string): ErrorBody {
    return { code, message };
}
