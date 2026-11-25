import { request } from "./client";
import type { Deck } from "../types/Deck";

// all decks of the logged in user (user comes from the token)
export async function getDecks(): Promise<Deck[]> {
    const data = await request<{ decks: Deck[] }>("GET", "/api/decks");
    return data.decks;
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
