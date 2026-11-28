import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import i18n, { detectLanguage } from ".";
import { apiErrorMessage } from "./apiErrors";
import { ApiError } from "../api/client";
import { MemoryRouter } from "react-router";
import LanguageSwitch from "../components/LanguageSwitch";
import Layout from "../components/Layout";
import SettingsDialog from "../components/SettingsDialog";
import { saveToken } from "../api/client";

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

describe("LanguageSwitch", () => {
    beforeAll(() => {
        // jsdom has no showModal()/close(): just toggle the open attribute
        HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
            this.open = true;
        };
        HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
            this.open = false;
        };
    });

    function Title() {
        const { t } = useTranslation();
        return <h1>{t("decks.title")}</h1>;
    }

    it("switches all texts at once, sets <html lang> and remembers the choice", async () => {
        const user = userEvent.setup();
        render(
            <>
                <LanguageSwitch />
                <Title />
            </>,
        );
        // the button names the current language
        await user.click(screen.getByRole("button", { name: "Sprache: Deutsch" }));
        expect(screen.getByRole("radio", { name: "Deutsch" })).toBeChecked();
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Deine Stapel");

        await user.click(screen.getByRole("radio", { name: "English" }));

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your decks");
        expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
        expect(screen.getByRole("button", { name: "Language: English" })).toBeInTheDocument();
        expect(document.documentElement.lang).toBe("en");
        expect(localStorage.getItem("flashcards_language")).toBe("en");
    });

    it("is in the top bar only for guests, logged in users find it in the settings", async () => {
        const { unmount } = render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );
        expect(screen.getByRole("button", { name: "Sprache: Deutsch" })).toBeInTheDocument();
        unmount();

        saveToken("abc.def.ghi");
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );
        expect(screen.queryByRole("button", { name: /^Sprache:/ })).not.toBeInTheDocument();
    });

    it("can be changed in the settings", async () => {
        const user = userEvent.setup();
        render(<SettingsDialog open onClose={() => {}} />);

        expect(screen.getByRole("radio", { name: "Deutsch" })).toBeChecked();
        await user.click(screen.getByRole("radio", { name: "English" }));

        expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
        expect(document.documentElement.lang).toBe("en");
    });
});
