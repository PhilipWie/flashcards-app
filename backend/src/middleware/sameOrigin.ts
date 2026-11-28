import type { NextFunction, Request, Response } from 'express';
import { apiError } from '../lib/errors.js';

// header the frontend sends with every request. A custom header forces a CORS preflight,
// so another site can't send it (OWASP CSRF: custom request header).
export const CSRF_HEADER = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'flashcards';

// CSRF protection for routes that are authenticated only by the refresh cookie.
// SameSite=Strict is set too, but OWASP counts it only as defense in depth.
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
    const expected = new URL(process.env.FRONTEND_URL ?? '').origin;
    const origin = req.get('Origin');
    // a missing or "null" origin is rejected as well (OWASP: don't allow null)
    if (origin !== expected || req.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
        return res.status(403).json(apiError('FORBIDDEN_ORIGIN', 'request from another origin'));
    }
    next();
}
