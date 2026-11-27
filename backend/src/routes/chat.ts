import { Router } from 'express';
import { and, eq, inArray } from 'drizzle-orm';
import { aiLimit } from '../middleware/rateLimit.js';
import { db } from '../db/db.js';
import { cards, decks } from '../db/schema.js';
import { parseId } from './cards.js';
import { AiUnavailableError, isAiConfigured } from '../lib/ai.js';
import { chatAboutCard, parseChatRequest } from '../lib/cardChat.js';

export const cardChatRouter = Router();

// POST /api/cards/:id/chat: question to the AI about one card.
// Nothing is stored: the client sends the whole (short) conversation every time.
cardChatRouter.post('/:id/chat', aiLimit, async (req, res) => {
    try {
        const cardId = parseId(req.params.id);
        if (cardId === null) {
            return res.status(400).json({
                message: 'Card id not valid',
            });
        }
        const parsed = parseChatRequest(req.body);
        if (!parsed.ok) {
            return res.status(400).json({
                message: parsed.message,
            });
        }
        // before the database query: nothing to do without a key
        if (!isAiConfigured()) {
            return res.status(503).json({
                message: 'AI chat not available',
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
        const reply = await chatAboutCard(card[0]!.front, card[0]!.back, parsed.value);
        return res.status(200).json({ reply });
    } catch (err: any) {
        if (err instanceof AiUnavailableError) {
            // our own message: no key, no provider text
            console.error(`AI chat failed: ${err.message}`);
            return res.status(503).json({
                message: 'AI chat not available',
            });
        }
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});
