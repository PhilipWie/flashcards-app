import { request } from "./client";
import type { Deck, DeckSummary } from "../types/Deck";

// all decks of the logged in user (user comes from the token), with card counts
export async function getDecks(): Promise<DeckSummary[]> {
    const data = await request<{ decks: DeckSummary[] }>("GET", "/api/decks");
    return data.decks;
}

// one deck with card counts, 404 if it doesn't exist or belongs to another user
export async function getDeck(id: number): Promise<DeckSummary> {
    const data = await request<{ deck: DeckSummary }>("GET", `/api/decks/${id}`);
    return data.deck;
}

export async function createDeck(name: string): Promise<Deck> {
    const data = await request<{ deck: Deck }>("POST", "/api/decks", { name });
    return data.deck;
}

export async function updateDeck(id: number, name: string): Promise<Deck> {
    const data = await request<{ deck: Deck }>("PATCH", `/api/decks/${id}`, { name });
    return data.deck;
}

// cards of the deck are deleted by the database (ON DELETE CASCADE)
export async function deleteDeck(id: number): Promise<void> {
    await request("DELETE", `/api/decks/${id}`);
}
