import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ApiError, getToken, request, saveToken } from "../api/client";
import { useApiError } from "./useApiError";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

// a 401 from request() whose refresh failed (session over), sent with the token "old"
async function sessionOverError(): Promise<ApiError> {
    saveToken("old");
    fetchMock
        .mockResolvedValueOnce(new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "x" }), { status: 401 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ code: "SESSION_EXPIRED", message: "x" }), { status: 401 }));
    return (await request("GET", "/api/decks").catch((e: unknown) => e)) as ApiError;
}

function Page({ err }: { err: ApiError }) {
    const handleApiError = useApiError();
    return (
        <button type="button" onClick={() => handleApiError(err)}>
            handle
        </button>
    );
}

function Login() {
    const state = useLocation().state as { sessionExpired?: boolean } | null;
    return <p>{state?.sessionExpired ? "login: expired" : "login"}</p>;
}

function renderAt(err: ApiError) {
    render(
        <MemoryRouter initialEntries={["/decks"]}>
            <Routes>
                <Route path="/decks" element={<Page err={err} />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe("useApiError with 401", () => {
    it("logs out and shows 'session expired' when the session is really over", async () => {
        const err = await sessionOverError();
        fetchMock.mockResolvedValue(new Response(null, { status: 204 })); // logout call
        renderAt(err);

        await userEvent.click(screen.getByRole("button", { name: "handle" }));

        expect(screen.getByText("login: expired")).toBeInTheDocument();
        expect(getToken()).toBeNull();
    });

    it("leaves a new login alone if the 401 belongs to the old session", async () => {
        const err = await sessionOverError();
        saveToken("new-login");
        renderAt(err);

        await userEvent.click(screen.getByRole("button", { name: "handle" }));

        // still on the page, token untouched, no logout request
        expect(screen.getByRole("button", { name: "handle" })).toBeInTheDocument();
        expect(getToken()).toBe("new-login");
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("goes to the login without 'session expired' after a normal logout", async () => {
        const err = await sessionOverError();
        localStorage.removeItem("flashcards_token");
        renderAt(err);

        await userEvent.click(screen.getByRole("button", { name: "handle" }));

        expect(screen.getByText("login")).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
