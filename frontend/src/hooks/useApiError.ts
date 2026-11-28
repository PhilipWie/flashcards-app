import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { logout } from "../api/auth";
import { apiErrorMessage } from "../i18n/apiErrors";

// Turns an error from request() into a translated message for the UI.
// 401 means the token is missing, invalid or expired: log out and go to /login.
// Returns null in that case, because the page is left anyway.
export function useApiError() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return useCallback(
        (err: unknown): string | null => {
            if (err instanceof ApiError && err.status === 401) {
                logout();
                navigate("/login", { replace: true });
                return null;
            }
            return apiErrorMessage(err, t);
        },
        [navigate, t],
    );
}
