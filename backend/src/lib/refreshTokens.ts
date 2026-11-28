import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { db } from '../db/db.js';
import { refresh_tokens } from '../db/schema.js';

// Refresh tokens (issue #17), see docs/technical_docu/jwt.md.
// Opaque random values in an HttpOnly cookie, stored as SHA-256 hash.
// Every refresh rotates the token; using an already rotated token again
// (outside a short grace period) revokes the whole login (theft detection).

// session ends after 1 day without use ...
export const REFRESH_IDLE_MS = 24 * 60 * 60 * 1000;
// ... and at the latest 7 days after login, even with regular refreshes
export const REFRESH_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
// two requests with the same token at nearly the same time (e.g. two tabs) are not theft
export const REUSE_GRACE_MS = 20 * 1000;

// 32 random bytes = 256 bits (OWASP: at least 64, prefer 128 or more)
export function generateToken(): string {
    return randomBytes(32).toString('base64url');
}

// a fast hash is enough for random tokens (no password, nothing to guess)
export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// idle limit from now, but never after the absolute limit of the login
export function expiryFor(sessionStartedAt: Date, now: Date): Date {
    const idle = now.getTime() + REFRESH_IDLE_MS;
    const absolute = sessionStartedAt.getTime() + REFRESH_ABSOLUTE_MS;
    return new Date(Math.min(idle, absolute));
}

export type TokenState = 'valid' | 'grace' | 'reused' | 'expired' | 'revoked';

type TokenTimes = { expires_at: Date; replaced_at: Date | null; revoked_at: Date | null };

// what a presented refresh token means, decided only from its row
export function classifyToken(row: TokenTimes, now: Date): TokenState {
    if (row.revoked_at) return 'revoked';
    if (row.expires_at.getTime() <= now.getTime()) return 'expired';
    if (row.replaced_at) {
        return now.getTime() - row.replaced_at.getTime() <= REUSE_GRACE_MS ? 'grace' : 'reused';
    }
    return 'valid';
}

export type IssuedToken = { token: string; expiresAt: Date };

async function insertToken(
    tx: Pick<typeof db, 'insert'>,
    userId: number,
    familyId: string,
    sessionStartedAt: Date,
    now: Date,
): Promise<IssuedToken> {
    const token = generateToken();
    const expiresAt = expiryFor(sessionStartedAt, now);
    await tx.insert(refresh_tokens).values({
        user_id: userId,
        family_id: familyId,
        token_hash: hashToken(token),
        session_started_at: sessionStartedAt,
        expires_at: expiresAt,
    });
    return { token, expiresAt };
}

// after a successful login: new family. Also removes expired rows of all users
// (they can't be used anymore, so they are not needed for reuse detection).
export async function startSession(userId: number): Promise<IssuedToken> {
    const now = new Date();
    await db.delete(refresh_tokens).where(lt(refresh_tokens.expires_at, now));
    return insertToken(db, userId, randomUUID(), now, now);
}

// Exchanges a refresh token for a new one. Returns null if the token is unknown,
// expired, revoked or reused. Reuse revokes all tokens of that login.
export async function rotateSession(token: string): Promise<(IssuedToken & { userId: number }) | null> {
    const now = new Date();
    return db.transaction(async (tx) => {
        // FOR UPDATE: two parallel requests with the same token run one after the other,
        // so the second one sees replaced_at of the first
        const rows = await tx.select().from(refresh_tokens)
            .where(eq(refresh_tokens.token_hash, hashToken(token)))
            .for('update');
        const row = rows[0];
        if (!row) return null;

        const state = classifyToken(row, now);
        if (state === 'reused') {
            // the old token was used again after its rotation: someone else may have it
            await tx.update(refresh_tokens)
                .set({ revoked_at: now })
                .where(and(eq(refresh_tokens.family_id, row.family_id), isNull(refresh_tokens.revoked_at)));
            console.warn(`refresh token reuse detected, login revoked (user ${row.user_id})`);
            return null;
        }
        if (state !== 'valid' && state !== 'grace') return null;

        // grace: the token was just rotated by a parallel request, issue another one
        // for the same login instead of treating it as theft
        if (state === 'valid') {
            await tx.update(refresh_tokens).set({ replaced_at: now }).where(eq(refresh_tokens.id, row.id));
        }
        const issued = await insertToken(tx, row.user_id, row.family_id, row.session_started_at, now);
        return { ...issued, userId: row.user_id };
    });
}

// logout: revokes all tokens of this login (not other logins of the same user)
export async function endSession(token: string): Promise<void> {
    const rows = await db.select({ family_id: refresh_tokens.family_id }).from(refresh_tokens)
        .where(eq(refresh_tokens.token_hash, hashToken(token)));
    const row = rows[0];
    if (!row) return;
    await db.update(refresh_tokens)
        .set({ revoked_at: new Date() })
        .where(and(eq(refresh_tokens.family_id, row.family_id), isNull(refresh_tokens.revoked_at)));
}
