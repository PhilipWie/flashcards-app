import { Router } from 'express';
import { and, eq, inArray } from 'drizzle-orm';
import { aiLimit } from '../middleware/rateLimit.js';
import { db } from '../db/db.js';
import { cards, decks } from '../db/schema.js';
import { parseId } from './cards.js';
import { AiUnavailableError, isAiConfigured } from '../lib/ai.js';
import { ANSWER_MAX, checkAnswer } from '../lib/answerCheck.js';

export const cardCheckRouter = Router();

const AI_UNAVAILABLE = 'AI check not available';

// POST /api/cards/:id/check: asks the AI whether a typed answer matches the card.
// Only a suggestion: the card is not changed, the user still answers with /review.
cardCheckRouter.post('/:id/check', aiLimit, async (req, res) => {
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
        const { answer } = req.body;
        if (typeof answer !== 'string' || answer.trim() === '') {
            return res.status(400).json({
                message: 'answer must be a non-empty string',
            });
        }
        if (answer.length > ANSWER_MAX) {
            return res.status(400).json({
                message: `answer must be at most ${ANSWER_MAX} characters`,
            });
        }
        // before the database query: nothing to do without a key
        if (!isAiConfigured()) {
            return res.status(503).json({
                message: AI_UNAVAILABLE,
            });
        }
        const userId = Number(req.userId);
        const userDecks = db.select({ id: decks.id }).from(decks).where(eq(decks.user_id, userId));
        const card = await db.select({ front: cards.front, back: cards.back }).from(cards)
            .where(and(eq(cards.id, cardId), inArray(cards.deck_id, userDecks)));
        if (card.length === 0) {
            return res.status(404).json({
                message: 'Card not found',
            });
        }
        const result = await checkAnswer(card[0]!.front, card[0]!.back, answer.trim());
        return res.status(200).json(result);
    } catch (err: any) {
        if (err instanceof AiUnavailableError) {
            // our own message: no key, no provider text
            console.error(`AI check failed: ${err.message}`);
            return res.status(503).json({
                message: AI_UNAVAILABLE,
            });
        }
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});
