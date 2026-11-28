import { afterEach, describe, expect, it, vi } from "vitest";
import { shuffle } from "./shuffle";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("shuffle", () => {
    it("keeps all items", () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8];
        expect(shuffle(items).toSorted((a, b) => a - b)).toEqual(items);
    });

    it("does not change the input", () => {
        const items = [1, 2, 3];
        shuffle(items);
        expect(items).toEqual([1, 2, 3]);
    });

    it("swaps with the index from Math.random (Fisher-Yates)", () => {
        // random 0 -> always swap with index 0: [1,2,3] -> [3,2,1] -> [2,3,1]
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(shuffle([1, 2, 3])).toEqual([2, 3, 1]);
    });
});
