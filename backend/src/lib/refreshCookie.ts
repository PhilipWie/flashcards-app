import type { CookieOptions, Response } from 'express';
import type { IssuedToken } from './refreshTokens.js';

export const REFRESH_COOKIE = 'refresh_token';

// Only sent to /api/auth/* (refresh, logout), never readable from JavaScript.
// No Domain attribute: the cookie stays on the backend host.
// (__Host- prefix would need Path=/, so the narrow path is preferred here.)
const cookieOptions: CookieOptions = {
    httpOnly: true,
    // browsers treat http://localhost as secure, so this also works in development
    secure: true,
    sameSite: 'strict',
    path: '/api/auth',
};

export function setRefreshCookie(res: Response, issued: IssuedToken) {
    res.cookie(REFRESH_COOKIE, issued.token, { ...cookieOptions, expires: issued.expiresAt });
}

export function clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
}
