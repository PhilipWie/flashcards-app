import { request } from "./client";
import type { Card } from "../types/Card";

// all cards of a deck (for managing, not only the due ones)
export async function getCards(deckId: number): Promise<Card[]> {
    const data = await request<{ cards: Card[] }>("GET", `/api/decks/${deckId}/cards`);
    return data.cards;
}

export async function createCard(deckId: number, front: string, back: string): Promise<Card> {
    const data = await request<{ card: Card }>("POST", `/api/decks/${deckId}/cards`, { front, back });
    return data.card;
}

// only send the fields that changed
export async function updateCard(id: number, changes: { front?: string; back?: string }): Promise<Card> {
    const data = await request<{ card: Card }>("PATCH", `/api/cards/${id}`, changes);
    return data.card;
}

// backend answers 204 without body
export async function deleteCard(id: number): Promise<void> {
    await request("DELETE", `/api/cards/${id}`);
}
