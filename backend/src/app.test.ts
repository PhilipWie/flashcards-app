import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app.js";
import { signToken } from "./jwt.js";

// only routes that answer before the database is used,
// so these tests run without PostgreSQL (e.g. in CI)

describe("GET /api/health", () => {
    it("answers 200 with status ok", async () => {
        const res = await request(app).get("/api/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});

describe("requireAuth", () => {
    it("rejects a request without token", async () => {
        const res = await request(app).get("/api/decks");
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: "unauthorized" });
    });

    it("rejects an invalid token", async () => {
        const res = await request(app).get("/api/decks").set("Authorization", "Bearer not-a-jwt");
        expect(res.status).toBe(401);
    });

    it("rejects a token with a different scheme", async () => {
        const token = await signToken(1);
        const res = await request(app).get("/api/decks").set("Authorization", `Basic ${token}`);
        expect(res.status).toBe(401);
    });
});

describe("input validation (before any database query)", () => {
    it("rejects an invalid deck id", async () => {
        const token = await signToken(1);
        const res = await request(app).get("/api/decks/abc").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    it("rejects a registration with an invalid email", async () => {
        const res = await request(app).post("/api/register").send({ email: "a@b", password: "geheim123" });
        expect(res.status).toBe(400);
    });

    it("rejects a registration with a too short password", async () => {
        const res = await request(app).post("/api/register").send({ email: "test@example.com", password: "123" });
        expect(res.status).toBe(400);
    });
});
