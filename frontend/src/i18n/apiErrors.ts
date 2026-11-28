import type { TFunction } from "i18next";
import { ApiError } from "../api/client";
import { isErrorCode } from "./errorCodes";

// Translated message for an error from request().
// The backend sends a stable code, its English message is never shown.
export function apiErrorMessage(err: unknown, t: TFunction): string {
    if (!(err instanceof ApiError)) return t("errors.network");
    if (isErrorCode(err.code)) return t(`errors.${err.code}`);
    // e.g. a proxy answering without our JSON body
    if (err.status === 429) return t("errors.TOO_MANY_REQUESTS");
    return t("errors.unknown", { status: err.status });
}
