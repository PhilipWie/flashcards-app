import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./settings";

const KEY = "flashcards_settings";

// settings.ts reads localStorage once when it is loaded,
// so every test loads a fresh copy of the module
async function loadWith(raw: string | null) {
    if (raw !== null) localStorage.setItem(KEY, raw);
    vi.resetModules();
    return import("./settings");
}

beforeEach(() => {
    localStorage.clear();
});

describe("reading settings from localStorage", () => {
    it.each([
        ["nothing stored", null],
        ["broken JSON", "{nope"],
        ["an array", "[1,2]"],
        ["null", "null"],
        ["a string", '"hello"'],
    ])("uses the defaults for %s", async (_name, raw) => {
        const { getSettings } = await loadWith(raw);
        expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    });

    it("replaces values with a wrong type by their default", async () => {
        const raw = JSON.stringify({ practiceEffect: "<img src=x>", shuffleByDefault: "yes", practiceBoxes: "1,2", typeAnswer: 1 });
        const { getSettings } = await loadWith(raw);
        expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    });

    it("keeps only valid boxes, without duplicates, sorted", async () => {
        const raw = JSON.stringify({ practiceBoxes: [5, 0, 2, 2, "3", 9, -1] });
        const { getSettings } = await loadWith(raw);
        expect(getSettings().practiceBoxes).toEqual([2, 5]);
    });

    it("falls back to all boxes for an empty selection", async () => {
        const { getSettings } = await loadWith(JSON.stringify({ practiceBoxes: [] }));
        expect(getSettings().practiceBoxes).toEqual([1, 2, 3, 4, 5]);
    });

    it("reads valid settings", async () => {
        const raw = JSON.stringify({
            practiceEffect: "reset-unknown",
            shuffleByDefault: false,
            practiceBoxes: [4, 1],
            typeAnswer: true,
        });
        const { getSettings } = await loadWith(raw);
        expect(getSettings()).toEqual({
            practiceEffect: "reset-unknown",
            shuffleByDefault: false,
            practiceBoxes: [1, 4],
            typeAnswer: true,
        });
    });
});

describe("updateSettings", () => {
    it("saves the change and notifies subscribers", async () => {
        const { getSettings, subscribeSettings, updateSettings } = await loadWith(null);
        const listener = vi.fn();
        const unsubscribe = subscribeSettings(listener);

        updateSettings({ shuffleByDefault: false });

        expect(getSettings().shuffleByDefault).toBe(false);
        expect(JSON.parse(localStorage.getItem(KEY)!).shuffleByDefault).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
    });

    it("validates changes the same way as stored data", async () => {
        const { getSettings, updateSettings } = await loadWith(null);
        updateSettings({ practiceBoxes: [9, 0] });
        expect(getSettings().practiceBoxes).toEqual([1, 2, 3, 4, 5]);
    });
});
