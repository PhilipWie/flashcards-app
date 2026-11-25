import { request, saveToken, removeToken } from "./client";

// creates a new account, the user still has to log in afterwards
export async function register(email: string, password: string): Promise<void> {
    await request<{ message: string }>("POST", "/api/register", { email, password });
}

// logs in and stores the token, so request() sends it with every call
export async function login(email: string, password: string): Promise<void> {
    const data = await request<{ message: string; token: string }>("POST", "/api/login", { email, password });
    saveToken(data.token);
}

// no backend call: a JWT can't be revoked, the frontend just forgets it
export function logout(): void {
    removeToken();
}
