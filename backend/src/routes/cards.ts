import { Router } from 'express';
import { apiLimit } from "../middleware/rateLimit.js";
import { db } from '../db/db.js';
import {decks} from "../db/schema.js";
import {cards} from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { and } from "drizzle-orm";

// max length of a card side (front/back) after trimming
const CARD_TEXT_MAX = 1000;

export const deckCardsRouter = Router({mergeParams: true});
export const cardsRouter = Router();

// Parses an value into a Number
export function parseId(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}
// GET /api/decks/:deckId/cards Gets all cards in a specific deck of a user
deckCardsRouter.get('/',apiLimit, async (req, res) => {
    try {
        const deckId = req.params.deckId;
        if (typeof deckId !== 'string'){
            return res.status(400).json({
                message: 'Deck id not valid'
            });
        }
        const ndeckId = parseId(deckId);
        if (ndeckId === null){
            return res.status(400).json({
                message: 'Deck id not valid',
            })
        }
        const userId = Number(req.userId)
        const result = await db.select({id: decks.id}).from(decks).where(and(eq(decks.id,ndeckId),eq(decks.user_id,userId)));
        if (result.length === 0) {
            return res.status(404).json({
                message: `Deck not found`,
            })
        }
        const cards_result = await db.select({id: cards.id,front: cards.front,back: cards.back,box: cards.box,next_review: cards.next_review})
            .from(cards)
            .where(eq(cards.deck_id,ndeckId));
        return res.status(200).json({
            cards: cards_result,
        })
    }catch(err: any) {
        console.error(err)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

// POST /api/decks/:deckId/cards: creates a card in the given deck
deckCardsRouter.post('/', apiLimit, async (req, res) => {
    try {
        const deckId = parseId(req.params.deckId);
        if (deckId === null) {
            return res.status(400).json({
                message: 'Deck id not valid',
            });
        }
        if (req.body == undefined || typeof req.body != "object") {
            return res.status(400).json({
                message: 'wrong format of input data',
            });
        }
        const { front, back } = req.body;
        if (typeof front !== 'string' || typeof back !== 'string') {
            return res.status(400).json({
                message: 'front and back must be strings',
            });
        }
        const trimmedFront = front.trim();
        const trimmedBack = back.trim();
        if (trimmedFront.length < 1 || trimmedBack.length < 1) {
            return res.status(400).json({
                message: 'front and back must not be empty',
            });
        }
        if (trimmedFront.length > CARD_TEXT_MAX || trimmedBack.length > CARD_TEXT_MAX) {
            return res.status(400).json({
                message: `front and back must be at most ${CARD_TEXT_MAX} characters`,
            });
        }
        const userId = Number(req.userId);
        const deck = await db.select({id: decks.id}).from(decks)
            .where(and(eq(decks.id, deckId), eq(decks.user_id, userId)));
        if (deck.length === 0) {
            return res.status(404).json({
                message: 'Deck not found',
            });
        }
        // box (1) and next_review (today) come from default values in schema
        const result = await db.insert(cards)
            .values({deck_id: deckId, front: trimmedFront, back: trimmedBack})
            .returning({
                id: cards.id,
                front: cards.front,
                back: cards.back,
                box: cards.box,
                next_review: cards.next_review,
            });
        return res.status(201).json({
            card: result[0],
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

// PATCH /api/cards/:id: changes front and back of a card
cardsRouter.patch('/:id', apiLimit, async (req, res) => {
    try {
        const cardId = parseId(req.params.id);
        if (cardId === null) {
            return res.status(400).json({
                message: 'Card id not valid',
            });
        }
        if (req.body == undefined || typeof req.body != "object") {
            return res.status(400).json({
                message: 'wrong format of input data',
            });
        }
        const updates: { front?: string; back?: string } = {};
        for (const field of ['front', 'back'] as const) {
            const value = req.body[field];
            if (value === undefined) continue;
            if (typeof value !== 'string' || value.trim().length < 1) {
                return res.status(400).json({
                    message: `${field} must be a non-empty string`,
                });
            }
            if (value.trim().length > CARD_TEXT_MAX) {
                return res.status(400).json({
                    message: `${field} must be at most ${CARD_TEXT_MAX} characters`,
                });
            }
            updates[field] = value.trim();
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: 'no changes given',
            });
        }
        const userId = Number(req.userId);
        const userDecks = db.select({id: decks.id}).from(decks).where(eq(decks.user_id, userId));
        const result = await db.update(cards)
            .set(updates)
            .where(and(eq(cards.id, cardId), inArray(cards.deck_id, userDecks)))
            .returning({
                id: cards.id,
                front: cards.front,
                back: cards.back,
                box: cards.box,
                next_review: cards.next_review,
            });
        if (result.length === 0) {
            return res.status(404).json({
                message: 'Card not found',
            });
        }
        return res.status(200).json({
            card: result[0],
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

// DELETE /api/cards/:id: deletes a card
cardsRouter.delete('/:id', apiLimit, async (req, res) => {
    try {
        const cardId = parseId(req.params.id);
        if (cardId === null) {
            return res.status(400).json({
                message: 'Card id not valid',
            });
        }
        const userId = Number(req.userId);
        const userDecks = db.select({id: decks.id}).from(decks).where(eq(decks.user_id, userId));
        const result = await db.delete(cards)
            .where(and(eq(cards.id, cardId), inArray(cards.deck_id, userDecks)))
            .returning({id: cards.id});
        if (result.length === 0) {
            return res.status(404).json({
                message: 'Card not found',
            });
        }
        return res.status(204).send();
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
