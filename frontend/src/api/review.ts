import { request } from "./client";
import type { Card } from "../types/Card";

// only cards that are due today (next_review <= today), can be empty
export async function getReviewCards(deckId: number): Promise<Card[]> {
    const data = await request<{ cards: Card[] }>("GET", `/api/decks/${deckId}/review`);
    return data.cards;
}

// the backend moves the card (Leitner) and returns it with new box and next_review
export async function submitReview(cardId: number, correct: boolean): Promise<Card> {
    const data = await request<{ card: Card }>("POST", `/api/cards/${cardId}/review`, { correct });
    return data.card;
}
