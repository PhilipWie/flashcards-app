import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../api/client";
import { logout } from "../api/auth";

// Turns an error from request() into a message for the UI.
// 401 means the token is missing, invalid or expired: log out and go to /login.
// Returns null in that case, because the page is left anyway.
export function useApiError() {
    const navigate = useNavigate();

    return useCallback(
        (err: unknown): string | null => {
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    logout();
                    navigate("/login", { replace: true });
                    return null;
                }
                if (err.status === 429) {
                    return "Zu viele Anfragen. Bitte kurz warten und erneut versuchen.";
                }
                // backend messages are English for now, see issue #2
                return err.message;
            }
            // fetch itself failed, e.g. backend not running
            return "Server nicht erreichbar. Bitte später erneut versuchen.";
        },
        [navigate],
    );
}
