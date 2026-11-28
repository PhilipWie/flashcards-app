import { postAuth, request, saveToken, removeToken } from "./client";

// creates a new account, the user still has to log in afterwards
export async function register(email: string, password: string): Promise<void> {
    await request<{ message: string }>("POST", "/api/register", { email, password });
}

// logs in and stores the access token, so request() sends it with every call
export async function login(email: string, password: string): Promise<void> {
    const data = await request<{ message: string; token: string }>("POST", "/api/login", { email, password });
    saveToken(data.token);
}

// The backend sets the refresh token as HttpOnly cookie, JavaScript never sees it.

// Forgets the access token right away (the pages check it synchronously), then revokes the
// refresh token in the backend. The access token itself can't be revoked: it stays valid
// until it expires (15 min), but it is gone from this browser.
export async function logout(): Promise<void> {
    removeToken();
    try {
        await postAuth("/api/auth/logout");
    } catch {
        // backend not reachable: the cookie expires on its own
    }
}
