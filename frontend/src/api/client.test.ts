import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getToken, isStaleAuthError, removeToken, request, saveToken } from "./client";
import { logout } from "./auth";

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
        expect(lastInit()).toEqual({
            method: "GET",
            headers: { "X-Requested-With": "flashcards" },
            body: undefined,
            credentials: "include",
        });
    });

    it("sends JSON and the token as Bearer header", async () => {
        saveToken("abc.def.ghi");
        fetchMock.mockResolvedValue(jsonResponse(201, { deck: { id: 1, name: "Web" } }));

        await request("POST", "/api/decks", { name: "Web" });

        expect(lastInit()).toEqual({
            method: "POST",
            headers: {
                "X-Requested-With": "flashcards",
                "Content-Type": "application/json",
                Authorization: "Bearer abc.def.ghi",
            },
            body: JSON.stringify({ name: "Web" }),
            credentials: "include",
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

// 401 for an expired access token, and the paths fetch was called with (in order)
const expired = () => jsonResponse(401, { code: "UNAUTHORIZED", message: "unauthorized" });
const paths = () => fetchMock.mock.calls.map(([url]) => String(url).replace(/^.*?(\/api\/)/, "/api/"));

describe("automatic refresh on 401", () => {

    it("renews the access token with the refresh cookie and retries the request once", async () => {
        saveToken("old");
        fetchMock
            .mockResolvedValueOnce(expired())
            .mockResolvedValueOnce(jsonResponse(200, { token: "new" }))
            .mockResolvedValueOnce(jsonResponse(200, { decks: [] }));

        await expect(request("GET", "/api/decks")).resolves.toEqual({ decks: [] });

        expect(paths()).toEqual(["/api/decks", "/api/auth/refresh", "/api/decks"]);
        expect(getToken()).toBe("new");
        expect(lastInit().headers).toMatchObject({ Authorization: "Bearer new" });
        // the refresh call itself: cookie + CSRF header, no access token
        expect(fetchMock.mock.calls[1][1]).toEqual({
            method: "POST",
            headers: { "X-Requested-With": "flashcards" },
            credentials: "include",
        });
    });

    it("throws the 401 if the session is over (refresh fails)", async () => {
        saveToken("old");
        fetchMock
            .mockResolvedValueOnce(expired())
            .mockResolvedValueOnce(jsonResponse(401, { code: "SESSION_EXPIRED", message: "x" }));

        await expect(request("GET", "/api/decks")).rejects.toMatchObject({ status: 401 });
        expect(paths()).toEqual(["/api/decks", "/api/auth/refresh"]);
    });

    it("parallel 401 responses share one refresh", async () => {
        saveToken("old");
        fetchMock.mockImplementation(async (url, init) => {
            const path = String(url);
            if (path.endsWith("/api/auth/refresh")) return jsonResponse(200, { token: "new" });
            const auth = (init?.headers as Record<string, string>).Authorization;
            return auth === "Bearer new" ? jsonResponse(200, { ok: true }) : expired();
        });

        await Promise.all([request("GET", "/api/decks"), request("GET", "/api/stats"), request("GET", "/api/decks/1")]);

        expect(paths().filter((p) => p === "/api/auth/refresh")).toHaveLength(1);
    });

    it("does not refresh if another tab already did (token changed meanwhile)", async () => {
        saveToken("old");
        fetchMock
            .mockImplementationOnce(async () => {
                // another tab stores a new token while this request is on its way
                saveToken("from-other-tab");
                return expired();
            })
            .mockResolvedValueOnce(jsonResponse(200, { decks: [] }));

        await request("GET", "/api/decks");

        expect(paths()).toEqual(["/api/decks", "/api/decks"]);
        expect(lastInit().headers).toMatchObject({ Authorization: "Bearer from-other-tab" });
    });

    it.each([
        ["in this tab", () => removeToken()],
        // another tab: only the shared localStorage changes, not this tab's counter
        ["in another tab", () => localStorage.removeItem("flashcards_token")],
    ])("does not log in again if the user logged out %s during the refresh", async (_name, logOut) => {
        saveToken("old");
        fetchMock.mockResolvedValueOnce(expired()).mockImplementationOnce(async () => {
            logOut();
            return jsonResponse(200, { token: "new" });
        });

        await expect(request("GET", "/api/decks")).rejects.toMatchObject({ status: 401 });
        expect(getToken()).toBeNull();
        // no retry with the new token
        expect(paths()).toEqual(["/api/decks", "/api/auth/refresh"]);
    });

    it.each(["/api/login", "/api/register"])("never refreshes for %s (no loop)", async (path) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(401, { code: "INVALID_CREDENTIALS", message: "x" }));

        await expect(request("POST", path, { email: "a", password: "b" })).rejects.toMatchObject({ status: 401 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keeps a new login from another tab that happened during the refresh", async () => {
        saveToken("old");
        fetchMock.mockResolvedValueOnce(expired()).mockImplementationOnce(async () => {
            // other tab: logout and login again (maybe another user)
            localStorage.setItem("flashcards_token", "other-login");
            return jsonResponse(200, { token: "new" });
        });

        await expect(request("GET", "/api/decks")).rejects.toMatchObject({ status: 401 });
        expect(getToken()).toBe("other-login");
    });

    it("does not call the backend when already logged out before the refresh", async () => {
        saveToken("old");
        fetchMock.mockImplementationOnce(async () => {
            removeToken();
            return expired();
        });

        await expect(request("GET", "/api/decks")).rejects.toMatchObject({ status: 401 });
        expect(paths()).toEqual(["/api/decks"]);
    });
});

describe("logout and refresh share one lock", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("sends the logout only after a running refresh, so the rotated cookie gets revoked", async () => {
        // jsdom has no Web Locks API: a minimal queue with the same behavior
        let tail: Promise<unknown> = Promise.resolve();
        vi.stubGlobal("navigator", {
            ...navigator,
            locks: {
                request: (_name: string, fn: () => Promise<unknown>) => {
                    const run = tail.then(fn);
                    tail = run.catch(() => undefined);
                    return run;
                },
            },
        });
        vi.stubGlobal("fetch", fetchMock);
        saveToken("old");
        let finishRefresh!: (res: Response) => void;
        fetchMock.mockImplementation((url) => {
            const path = String(url);
            if (path.endsWith("/api/auth/refresh")) return new Promise<Response>((resolve) => (finishRefresh = resolve));
            if (path.endsWith("/api/auth/logout")) return Promise.resolve(new Response(null, { status: 204 }));
            return Promise.resolve(expired());
        });

        const pending = request("GET", "/api/decks").catch((e: unknown) => e);
        await vi.waitFor(() => expect(paths()).toContain("/api/auth/refresh"));

        const loggedOut = logout();
        // token is gone right away, but the logout request waits for the refresh
        expect(getToken()).toBeNull();
        await Promise.resolve();
        expect(paths()).not.toContain("/api/auth/logout");

        finishRefresh(jsonResponse(200, { token: "new" }));
        await loggedOut;
        await pending;

        expect(paths()).toEqual(["/api/decks", "/api/auth/refresh", "/api/auth/logout"]);
        // the refresh result was not saved after the logout
        expect(getToken()).toBeNull();
    });
});

describe("isStaleAuthError", () => {
    it("is false for a normal expired session, true after logout or a new login", async () => {
        saveToken("old");
        fetchMock.mockResolvedValue(jsonResponse(401, { code: "SESSION_EXPIRED", message: "x" }));
        const err = (await request("GET", "/api/decks").catch((e: unknown) => e)) as ApiError;

        expect(isStaleAuthError(err)).toBe(false);
        saveToken("new-login");
        expect(isStaleAuthError(err)).toBe(true);
        removeToken();
        expect(isStaleAuthError(err)).toBe(true);
    });

    it("is false for errors that did not come from request()", () => {
        expect(isStaleAuthError(new ApiError(401, "x"))).toBe(false);
    });
});
