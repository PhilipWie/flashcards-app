import { Router } from 'express';
import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { apiLimit } from '../middleware/rateLimit.js';
import { db } from '../db/db.js';
import { cards, decks, reviews } from '../db/schema.js';
import { nextLeitner } from '../lib/leitner.js';
import { parseId } from './cards.js';

export const deckReviewRouter = Router({ mergeParams: true });
export const cardReviewRouter = Router();

// GET /api/decks/:deckId/review: gets all due cards (next_review <= today) of a deck
deckReviewRouter.get('/', apiLimit, async (req, res) => {
    try {
        const deckId = parseId(req.params.deckId);
        if (deckId === null) {
            return res.status(400).json({
                message: 'Deck id not valid',
            });
        }
        const userId = Number(req.userId);
        const deck = await db.select({ id: decks.id }).from(decks)
            .where(and(eq(decks.id, deckId), eq(decks.user_id, userId)));
        if (deck.length === 0) {
            return res.status(404).json({
                message: 'Deck not found',
            });
        }
        const dueCards = await db.select({
            id: cards.id,
            front: cards.front,
            back: cards.back,
            box: cards.box,
            next_review: cards.next_review,
        })
            .from(cards)
            .where(and(eq(cards.deck_id, deckId), lte(cards.next_review, sql`CURRENT_DATE`)));
        return res.status(200).json({
            cards: dueCards,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});

// POST /api/cards/:id/review: saves an answer and moves the card (Leitner)
// body { correct: boolean, practice?: boolean }
// practice: true (free practice) moves the card, but is not written to the learning history
cardReviewRouter.post('/:id/review', apiLimit, async (req, res) => {
    try {
        const cardId = parseId(req.params.id);
        if (cardId === null) {
            return res.status(400).json({
                message: 'Card id not valid',
            });
        }
        if (req.body == undefined || typeof req.body != 'object') {
            return res.status(400).json({
                message: 'wrong format of input data',
            });
        }
        const { correct, practice = false } = req.body;
        if (typeof correct !== 'boolean') {
            return res.status(400).json({
                message: 'correct must be a boolean',
            });
        }
        if (typeof practice !== 'boolean') {
            return res.status(400).json({
                message: 'practice must be a boolean',
            });
        }
        const userId = Number(req.userId);
        const userDecks = db.select({ id: decks.id }).from(decks).where(eq(decks.user_id, userId));
        const card = await db.select({ box: cards.box }).from(cards)
            .where(and(eq(cards.id, cardId), inArray(cards.deck_id, userDecks)));
        if (card.length === 0) {
            return res.status(404).json({
                message: 'Card not found',
            });
        }
        const { box, days } = nextLeitner(card[0]!.box, correct);
        // one transaction: the card is only moved if the answer is also saved, and the other way round
        const updated = await db.transaction(async (tx) => {
            // date is calculated by the database, so "today" is the same as in the due query
            const result = await tx.update(cards)
                .set({ box, next_review: sql`CURRENT_DATE + ${days}::int` })
                .where(eq(cards.id, cardId))
                .returning({
                    id: cards.id,
                    front: cards.front,
                    back: cards.back,
                    box: cards.box,
                    next_review: cards.next_review,
                });
            // card deleted between the lookup above and this update: nothing to save
            const card = result[0];
            if (!card) return null;
            if (!practice) {
                await tx.insert(reviews).values({ card_id: cardId, correct });
            }
            return card;
        });
        if (!updated) {
            return res.status(404).json({
                message: 'Card not found',
            });
        }
        return res.status(200).json({
            card: updated,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});
