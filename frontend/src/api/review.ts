import { request } from "./client";
import type { Card } from "../types/Card";
import type { CheckResult } from "../types/Check";

// only cards that are due today (next_review <= today), can be empty
export async function getReviewCards(deckId: number): Promise<Card[]> {
    const data = await request<{ cards: Card[] }>("GET", `/api/decks/${deckId}/review`);
    return data.cards;
}

// the backend moves the card (Leitner) and returns it with new box and next_review.
// practice: answer from free practice, not counted in the learning statistics
export async function submitReview(cardId: number, correct: boolean, practice = false): Promise<Card> {
    const data = await request<{ card: Card }>("POST", `/api/cards/${cardId}/review`, { correct, practice });
    return data.card;
}

// asks the AI in the backend whether the typed answer matches the card.
// Does not change the card. 503 = AI not available (no key, timeout).
export async function checkAnswer(cardId: number, answer: string): Promise<CheckResult> {
    return request<CheckResult>("POST", `/api/cards/${cardId}/check`, { answer });
}
