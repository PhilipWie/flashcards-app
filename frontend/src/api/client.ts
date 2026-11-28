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

export async function request<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    // only send Content-Type if there is a body
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    // protected routes expect "Authorization: Bearer <token>"
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${api_url}${path}`, {
        method: method,
        headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
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
        throw new ApiError(res.status, message, code);
    }
    // 204 No Content has no body, res.json() would throw
    if (res.status === 204) {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}
