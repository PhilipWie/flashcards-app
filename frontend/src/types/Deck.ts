export type Deck = {
    id: number;
    name: string;
}

// GET /api/decks and GET /api/decks/:id also send counts, computed by the database
export type DeckSummary = Deck & {
    card_count: number;
    due_count: number;
}
