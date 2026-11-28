import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request, saveToken } from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// the options request() passed to fetch
function lastInit(): RequestInit {
    return fetchMock.mock.calls.at(-1)![1]!;
}

describe("request", () => {
    it("sends no body, Content-Type or Authorization without body and token", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { decks: [] }));

        await expect(request("GET", "/api/decks")).resolves.toEqual({ decks: [] });

        expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/decks$/);
        expect(lastInit()).toEqual({ method: "GET", headers: {}, body: undefined });
    });

    it("sends JSON and the token as Bearer header", async () => {
        saveToken("abc.def.ghi");
        fetchMock.mockResolvedValue(jsonResponse(201, { deck: { id: 1, name: "Web" } }));

        await request("POST", "/api/decks", { name: "Web" });

        expect(lastInit()).toEqual({
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer abc.def.ghi" },
            body: JSON.stringify({ name: "Web" }),
        });
    });

    it("returns undefined for 204 No Content", async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
        await expect(request("DELETE", "/api/cards/1")).resolves.toBeUndefined();
    });

    it("throws ApiError with status, code and message from the backend", async () => {
        fetchMock.mockResolvedValue(jsonResponse(404, { code: "DECK_NOT_FOUND", message: "Deck not found" }));

        const error = await request("GET", "/api/decks/9").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 404, code: "DECK_NOT_FOUND", message: "Deck not found" });
    });

    it("uses a fallback message if the error body is not JSON", async () => {
        fetchMock.mockResolvedValue(new Response("Internal Server Error", { status: 500 }));
        await expect(request("GET", "/api/decks")).rejects.toMatchObject({ status: 500, message: "HTTP Error: 500" });
    });
});
