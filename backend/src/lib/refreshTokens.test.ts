import { describe, expect, it } from "vitest";
import {
    classifyToken,
    expiryFor,
    generateToken,
    hashToken,
    REFRESH_ABSOLUTE_MS,
    REFRESH_IDLE_MS,
    REUSE_GRACE_MS,
} from "./refreshTokens.js";

const now = new Date("2026-11-28T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const later = (ms: number) => new Date(now.getTime() + ms);

describe("generateToken / hashToken", () => {
    it("creates long random tokens", () => {
        const a = generateToken();
        expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes base64url
        expect(generateToken()).not.toBe(a);
    });

    it("stores only a SHA-256 hash, the same token gives the same hash", () => {
        const token = generateToken();
        expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
        expect(hashToken(token)).toBe(hashToken(token));
        expect(hashToken(token)).not.toContain(token);
    });
});

describe("expiryFor", () => {
    it("uses the idle limit for a fresh login", () => {
        expect(expiryFor(now, now)).toEqual(later(REFRESH_IDLE_MS));
    });

    it("never goes beyond the absolute limit of the login", () => {
        const started = ago(REFRESH_ABSOLUTE_MS - 60_000); // one minute left
        expect(expiryFor(started, now)).toEqual(later(60_000));
    });
});

describe("classifyToken", () => {
    const fresh = { expires_at: later(REFRESH_IDLE_MS), replaced_at: null, revoked_at: null };

    it("accepts an unused token", () => {
        expect(classifyToken(fresh, now)).toBe("valid");
    });

    it("rejects expired and revoked tokens", () => {
        expect(classifyToken({ ...fresh, expires_at: now }, now)).toBe("expired");
        expect(classifyToken({ ...fresh, revoked_at: ago(1000) }, now)).toBe("revoked");
    });

    it("treats a token rotated a moment ago as a parallel request (e.g. second tab)", () => {
        expect(classifyToken({ ...fresh, replaced_at: ago(REUSE_GRACE_MS) }, now)).toBe("grace");
    });

    it("detects reuse of a token rotated earlier", () => {
        expect(classifyToken({ ...fresh, replaced_at: ago(REUSE_GRACE_MS + 1) }, now)).toBe("reused");
    });

    it("revoked wins over everything else", () => {
        expect(classifyToken({ ...fresh, replaced_at: ago(1), revoked_at: ago(1) }, now)).toBe("revoked");
    });
});
