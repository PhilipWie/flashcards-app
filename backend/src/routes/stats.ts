import { Router } from 'express';
import { count, eq, sql } from 'drizzle-orm';
import { apiLimit } from '../middleware/rateLimit.js';
import { db } from '../db/db.js';
import { cards, decks, reviews } from '../db/schema.js';
import { MAX_BOX } from '../lib/leitner.js';
import { calcAccuracy, calcStreak, lastDays, STATS_DAYS, STATS_TIME_ZONE, todayIn } from '../lib/stats.js';

const router = Router();

// calendar day of an answer in German time, as "YYYY-MM-DD".
// sql.raw is safe here: the time zone is a constant from the code, never user input.
// (A bound parameter would not work: SELECT and GROUP BY would get different parameters.)
const reviewDay = sql<string>`to_char(${reviews.reviewed_at} AT TIME ZONE ${sql.raw(`'${STATS_TIME_ZONE}'`)}, 'YYYY-MM-DD')`;

// GET /api/stats: learning statistics of the logged in user
router.get('/', apiLimit, async (req, res) => {
    try {
        const userId = Number(req.userId);

        // answers per day, over the whole history (only days with answers, at most one row per day)
        const dayRows = await db.select({
            date: reviewDay,
            correct: sql<number>`count(*) filter (where ${reviews.correct})`.mapWith(Number),
            wrong: sql<number>`count(*) filter (where not ${reviews.correct})`.mapWith(Number),
        })
            .from(reviews)
            .innerJoin(cards, eq(reviews.card_id, cards.id))
            .innerJoin(decks, eq(cards.deck_id, decks.id))
            .where(eq(decks.user_id, userId))
            .groupBy(reviewDay);

        // current state of the cards: per box, and how many are due (same "today" as the learn mode)
        const boxRows = await db.select({
            box: cards.box,
            total: count(),
            due: sql<number>`count(*) filter (where ${cards.next_review} <= CURRENT_DATE)`.mapWith(Number),
        })
            .from(cards)
            .innerJoin(decks, eq(cards.deck_id, decks.id))
            .where(eq(decks.user_id, userId))
            .groupBy(cards.box);

        const today = todayIn(STATS_TIME_ZONE);
        const days = lastDays(dayRows, today, STATS_DAYS);

        const allCorrect = dayRows.reduce((sum, d) => sum + d.correct, 0);
        const allAnswers = dayRows.reduce((sum, d) => sum + d.correct + d.wrong, 0);
        const periodCorrect = days.reduce((sum, d) => sum + d.correct, 0);
        const periodAnswers = days.reduce((sum, d) => sum + d.correct + d.wrong, 0);

        // index 0 = box 1
        const boxes = Array.from({ length: MAX_BOX }, (_, i) => boxRows.find((r) => r.box === i + 1)?.total ?? 0);

        return res.status(200).json({
            today,
            streak: calcStreak(dayRows.map((d) => d.date), today),
            total: { answers: allAnswers, correct: allCorrect, accuracy: calcAccuracy(allCorrect, allAnswers) },
            period: { days: STATS_DAYS, answers: periodAnswers, correct: periodCorrect, accuracy: calcAccuracy(periodCorrect, periodAnswers) },
            days,
            cards: {
                total: boxes.reduce((sum, n) => sum + n, 0),
                due: boxRows.reduce((sum, r) => sum + r.due, 0),
                learned: boxes[MAX_BOX - 1] ?? 0,
                boxes,
            },
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});

export default router;
