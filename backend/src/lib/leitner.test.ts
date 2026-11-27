import { describe, expect, it } from "vitest";
import { INTERVAL_DAYS, MAX_BOX, nextLeitner } from "./leitner.js";

describe("nextLeitner", () => {
    it("moves a known card one box up with that box's interval", () => {
        expect(nextLeitner(1, true)).toEqual({ box: 2, days: 2 });
        expect(nextLeitner(3, true)).toEqual({ box: 4, days: 8 });
    });

    it("keeps a known card in the last box", () => {
        expect(nextLeitner(MAX_BOX, true)).toEqual({ box: MAX_BOX, days: 16 });
    });

    it.each([1, 2, 3, 4, 5])("moves a card from box %i back to box 1, due today", (box) => {
        expect(nextLeitner(box, false)).toEqual({ box: 1, days: 0 });
    });

    it("has one interval per box", () => {
        expect(INTERVAL_DAYS).toHaveLength(MAX_BOX);
    });
});
