import rateLimit from 'express-rate-limit'

const windowMs = 60_000
const standardHeaders = true
const legacyHeaders = false
const err_msg = 'too many requests, try again later';

// Rate Limit for authentication
export const authLimit = rateLimit({
    windowMs: windowMs,
    limit: 15,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    message: { message: err_msg},
});
// Rate limit for normal api requests without authentication purpose
export const apiLimit = rateLimit({
    windowMs: windowMs,
    limit: 80,
    standardHeaders: standardHeaders,
    legacyHeaders: legacyHeaders,
    message: { message: err_msg },
});
