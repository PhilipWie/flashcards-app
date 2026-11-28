import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import i18n, { detectLanguage } from ".";
import { apiErrorMessage } from "./apiErrors";
import { ApiError } from "../api/client";
import LanguageSelect from "../components/LanguageSelect";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("detectLanguage", () => {
    function stubBrowserLanguages(languages: string[]) {
        vi.stubGlobal("navigator", { ...navigator, languages, language: languages[0] });
    }

    it("uses the stored choice first", () => {
        localStorage.setItem("flashcards_language", "de");
        stubBrowserLanguages(["en-US"]);
        expect(detectLanguage()).toBe("de");
    });

    it("ignores an unknown stored value", () => {
        localStorage.setItem("flashcards_language", "<script>");
        stubBrowserLanguages(["de-AT", "en"]);
        expect(detectLanguage()).toBe("de");
    });

    it("takes the first supported browser language", () => {
        stubBrowserLanguages(["fr-FR", "en-GB", "de"]);
        expect(detectLanguage()).toBe("en");
    });

    it("falls back to English", () => {
        stubBrowserLanguages(["fr-FR", "es"]);
        expect(detectLanguage()).toBe("en");
    });
});

describe("apiErrorMessage", () => {
    const t = i18n.t.bind(i18n);

    it("translates the error code of the backend, not its English message", async () => {
        const err = new ApiError(400, "email is not in a correct format", "EMAIL_INVALID");
        expect(apiErrorMessage(err, t)).toBe("Bitte gib eine gültige E-Mail-Adresse ein.");
        await i18n.changeLanguage("en");
        expect(apiErrorMessage(err, t)).toBe("Please enter a valid email address.");
    });

    it("has a fallback for unknown codes and errors without code", () => {
        expect(apiErrorMessage(new ApiError(418, "teapot", "SOMETHING_NEW"), t)).toBe(
            "Etwas ist schiefgelaufen (HTTP 418).",
        );
        // keys of the errors object that are not backend codes
        expect(apiErrorMessage(new ApiError(500, "x", "network"), t)).toBe("Etwas ist schiefgelaufen (HTTP 500).");
        expect(apiErrorMessage(new ApiError(429, "too many"), t)).toBe(
            "Zu viele Anfragen. Bitte kurz warten und erneut versuchen.",
        );
    });

    it("reports a failed fetch as server not reachable", () => {
        expect(apiErrorMessage(new TypeError("Failed to fetch"), t)).toBe(
            "Server nicht erreichbar. Bitte später erneut versuchen.",
        );
    });
});

describe("LanguageSelect", () => {
    function Title() {
        const { t } = useTranslation();
        return <h1>{t("decks.title")}</h1>;
    }

    it("switches all texts at once, sets <html lang> and remembers the choice", async () => {
        const user = userEvent.setup();
        render(
            <>
                <LanguageSelect />
                <Title />
            </>,
        );
        const select = screen.getByRole("combobox", { name: "Sprache" });
        expect(select).toHaveValue("de");
        expect(screen.getByRole("heading")).toHaveTextContent("Deine Stapel");

        await user.selectOptions(select, "en");

        expect(screen.getByRole("heading")).toHaveTextContent("Your decks");
        expect(screen.getByRole("combobox", { name: "Language" })).toHaveValue("en");
        expect(document.documentElement.lang).toBe("en");
        expect(localStorage.getItem("flashcards_language")).toBe("en");
    });
});
