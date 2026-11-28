import type { TFunction } from "i18next";
import { ApiError } from "../api/client";
import de from "./locales/de";

type ErrorCode = Exclude<keyof typeof de.errors, "unknown" | "network">;

function isKnownCode(code: string | undefined): code is ErrorCode {
    return code !== undefined && code !== "unknown" && code !== "network" && Object.hasOwn(de.errors, code);
}

// Translated message for an error from request().
// The backend sends a stable code, its English message is never shown.
export function apiErrorMessage(err: unknown, t: TFunction): string {
    if (!(err instanceof ApiError)) return t("errors.network");
    if (isKnownCode(err.code)) return t(`errors.${err.code}`);
    // e.g. a proxy answering without our JSON body
    if (err.status === 429) return t("errors.TOO_MANY_REQUESTS");
    return t("errors.unknown", { status: err.status });
}
