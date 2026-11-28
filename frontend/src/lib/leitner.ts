import type { CSSProperties } from "react";
import type { Card } from "../types/Card";

export const BOXES = [1, 2, 3, 4, 5] as const;

// sets --box-color for .box-badge / .box-bar, colors come from tokens.css
export function boxColorStyle(box: number): CSSProperties {
    return { "--box-color": `var(--box-${box})` } as CSSProperties;
}

// number of cards per box, index 0 = box 1
export function countPerBox(cards: Card[]): number[] {
    return BOXES.map((box) => cards.filter((card) => card.box === box).length);
}

// only the cards whose box is in the given list (e.g. [1, 2] = "hard cards")
export function filterByBoxes(cards: Card[], boxes: readonly number[]): Card[] {
    return cards.filter((card) => boxes.includes(card.box));
}
