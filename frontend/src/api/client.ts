const api_url = import.meta.env.VITE_API_URL
const token_storage_name = "flashcards_token"
type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

// error with HTTP status and the backend's error code (e.g. "EMAIL_TAKEN"),
// so the UI can react to it and show a translated message
export class ApiError extends Error {
    status: number;
    code: string | undefined;

    constructor(status: number, message: string, code?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

// token helpers (localStorage)
export function saveToken(token: string) {
    localStorage.setItem(token_storage_name, token);
}

export function getToken(): string | null {
    return localStorage.getItem(token_storage_name);
}

export function removeToken() {
    localStorage.removeItem(token_storage_name);
}

// sent with every request. The backend requires it on the refresh cookie routes:
// a custom header forces a CORS preflight, so other sites can't send it (CSRF).
const CSRF_HEADERS = { "X-Requested-With": "flashcards" };

// no automatic refresh for these: they don't use the access token, and it would loop
const NO_REFRESH_PATHS = ["/api/login", "/api/register", "/api/auth/"];

function send(method: HttpMethod, path: string, body: unknown): Promise<Response> {
    const headers: Record<string, string> = { ...CSRF_HEADERS };
    // only send Content-Type if there is a body
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    // protected routes expect "Authorization: Bearer <token>"
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${api_url}${path}`, {
        method: method,
        headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        // send and receive the HttpOnly refresh cookie (only used by /api/login and /api/auth/*)
        credentials: "include",
    });
}

async function toApiError(res: Response): Promise<ApiError> {
    // fallback, if the backend sends no { code, message }
    let message = `HTTP Error: ${res.status}`;
    let code: string | undefined;
    try {
        const data = await res.json();
        if (data && typeof data.message === "string") {
            message = data.message;
        }
        if (data && typeof data.code === "string") {
            code = data.code;
        }
    } catch {
        // body was empty or not JSON
    }
    return new ApiError(res.status, message, code);
}

// POST to a refresh cookie route (/api/auth/refresh, /api/auth/logout), no access token needed
export function postAuth(path: "/api/auth/refresh" | "/api/auth/logout"): Promise<Response> {
    return fetch(`${api_url}${path}`, { method: "POST", headers: CSRF_HEADERS, credentials: "include" });
}

// the refresh running in this tab: parallel 401 responses wait for the same one
let refreshing: Promise<boolean> | null = null;

// Gets a new access token with the refresh cookie. Returns false if the session is over.
// failedToken: the token the failed request was sent with
export function refreshAccessToken(failedToken: string | null): Promise<boolean> {
    refreshing ??= withRefreshLock(() => runRefresh(failedToken)).finally(() => {
        refreshing = null;
    });
    return refreshing;
}

// Only one tab refreshes at a time (Web Locks API). Without it, two tabs would send the same
// refresh token, and the backend could take the second one for a stolen token.
function withRefreshLock(fn: () => Promise<boolean>): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.locks) {
        return navigator.locks.request("flashcards-refresh", fn);
    }
    return fn();
}

async function runRefresh(failedToken: string | null): Promise<boolean> {
    // another tab refreshed while this one waited for the lock: use its token
    const current = getToken();
    if (current !== null && current !== failedToken) return true;
    try {
        const res = await postAuth("/api/auth/refresh");
        if (!res.ok) return false;
        const data: unknown = await res.json();
        if (typeof data !== "object" || data === null || typeof (data as { token?: unknown }).token !== "string") {
            return false;
        }
        saveToken((data as { token: string }).token);
        return true;
    } catch {
        // backend not reachable: treat like a failed refresh, the request error is shown
        return false;
    }
}

export async function request<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const sentToken = getToken();
    let res = await send(method, path, body);

    // access token expired (15 min): renew it once with the refresh cookie and retry
    if (res.status === 401 && !NO_REFRESH_PATHS.some((p) => path.startsWith(p))) {
        if (await refreshAccessToken(sentToken)) {
            res = await send(method, path, body);
        }
    }

    if (!res.ok) {
        throw await toApiError(res);
    }
    // 204 No Content has no body, res.json() would throw
    if (res.status === 204) {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}
