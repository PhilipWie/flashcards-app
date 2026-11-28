import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ApiError } from "../api/client";
import { logout } from "../api/auth";
import { apiErrorMessage } from "../i18n/apiErrors";
import type { SessionExpiredState } from "../pages/LoginPage";

// Turns an error from request() into a translated message for the UI.
// 401 means request() could not renew the access token with the refresh cookie either
// (session over after 1 day without use or 7 days after login): log out, go to /login
// and show "session expired". Returns null in that case, because the page is left anyway.
export function useApiError() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return useCallback(
        (err: unknown): string | null => {
            if (err instanceof ApiError && err.status === 401) {
                void logout();
                const state: SessionExpiredState = { sessionExpired: true };
                navigate("/login", { replace: true, state });
                return null;
            }
            return apiErrorMessage(err, t);
        },
        [navigate, t],
    );
}
