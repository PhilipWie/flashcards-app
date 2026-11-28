import rateLimit from 'express-rate-limit'
import { apiError } from '../lib/errors.js'

const windowMs = 60_000
const standardHeaders = true
const legacyHeaders = false
const err_body = apiError('TOO_MANY_REQUESTS', 'too many requests, try again later');

// Rate Limit for authentication
export const authLimit = rateLimit({
    windowMs: windowMs,
    limit: 15,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    message: err_body,
});
// Rate limit for normal api requests without authentication purpose
export const apiLimit = rateLimit({
    windowMs: windowMs,
    limit: 80,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    message: err_body,
});

// Refresh and logout: own counter, so refreshes from several tabs don't use up the login limit
export const refreshLimit = rateLimit({
    windowMs: windowMs,
    limit: 30,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    message: err_body,
});

// AI requests cost money: own, stricter limit per user (not per IP).
// Must run after requireAuth, which sets req.userId.
export const aiLimit = rateLimit({
    windowMs: windowMs,
    limit: 20,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    keyGenerator: (req) => `user-${req.userId}`,
    message: err_body,
});
