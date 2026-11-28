// runs before every test file
import "@testing-library/jest-dom/vitest"; // matchers like toBeDisabled(), toBeInTheDocument()
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import i18n from "../i18n";

beforeEach(async () => {
    // the tests check German texts, independent of the language of the machine
    await i18n.changeLanguage("de");
});

afterEach(() => {
    // unmount rendered components and reset storage between tests
    cleanup();
    localStorage.clear();
});
