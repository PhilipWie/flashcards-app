import { describe, expect, it } from "vitest";
import type { Card } from "../types/Card";
import { countPerBox, filterByBoxes } from "./leitner";

function card(id: number, box: number): Card {
    return { id, front: `front ${id}`, back: `back ${id}`, box, next_review: "2026-11-27" };
}

const cards = [card(1, 1), card(2, 1), card(3, 2), card(4, 5)];

describe("countPerBox", () => {
    it("counts the cards per box, index 0 = box 1", () => {
        expect(countPerBox(cards)).toEqual([2, 1, 0, 0, 1]);
    });

    it("returns zeros for no cards", () => {
        expect(countPerBox([])).toEqual([0, 0, 0, 0, 0]);
    });
});

describe("filterByBoxes", () => {
    it("keeps only cards in the given boxes", () => {
        expect(filterByBoxes(cards, [1, 2]).map((c) => c.id)).toEqual([1, 2, 3]);
    });

    it("returns nothing for an empty selection", () => {
        expect(filterByBoxes(cards, [])).toEqual([]);
    });
});
