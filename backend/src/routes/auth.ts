import { Router } from 'express';
import { refreshLimit } from '../middleware/rateLimit.js';
import { requireSameOrigin } from '../middleware/sameOrigin.js';
import { apiError } from '../lib/errors.js';
import { endSession, rotateSession } from '../lib/refreshTokens.js';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from '../lib/refreshCookie.js';
import { signToken } from '../jwt.js';

const router = Router();

// POST /api/auth/refresh: new access token for the refresh cookie, the cookie is rotated.
// No requireAuth: the access token is usually expired when this is called.
router.post('/refresh', refreshLimit, requireSameOrigin, async (req, res) => {
    // responses contain tokens: never cache them
    res.set('Cache-Control', 'no-store');
    try {
        const token: unknown = req.cookies?.[REFRESH_COOKIE];
        if (typeof token !== 'string' || token === '') {
            return res.status(401).json(apiError('SESSION_EXPIRED', 'no refresh token'));
        }
        const rotated = await rotateSession(token);
        if (!rotated) {
            // unknown, expired, revoked or reused: same answer, no details for an attacker
            clearRefreshCookie(res);
            return res.status(401).json(apiError('SESSION_EXPIRED', 'refresh token not valid'));
        }
        setRefreshCookie(res, rotated);
        return res.status(200).json({ token: await signToken(rotated.userId) });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json(apiError('INTERNAL_ERROR', 'Internal Server Error'));
    }
});

// POST /api/auth/logout: revokes this login and deletes the cookie.
// Works without a valid access token; without a cookie there is nothing to revoke.
router.post('/logout', refreshLimit, requireSameOrigin, async (req, res) => {
    try {
        const token: unknown = req.cookies?.[REFRESH_COOKIE];
        if (typeof token === 'string' && token !== '') {
            await endSession(token);
        }
        clearRefreshCookie(res);
        return res.status(204).send();
    } catch (err: any) {
        console.error(err);
        return res.status(500).json(apiError('INTERNAL_ERROR', 'Internal Server Error'));
    }
});

export default router;
