import express from 'express';
import healthRouter from './routes/health.js'
import registerRouter from './routes/register.js'
import loginRouter from './routes/login.js'
import decksRouter from './routes/decks.js'
import { deckCardsRouter, cardsRouter } from './routes/cards.js'
import { deckReviewRouter, cardReviewRouter } from './routes/review.js'
import statsRouter from './routes/stats.js'
import { cardCheckRouter } from './routes/check.js'
import { cardChatRouter } from './routes/chat.js'
import requireAuth from './middleware/auth.js'
import cors from 'cors'

const app = express();
app.use(cors({origin: process.env.FRONTEND_URL,}));
app.use(express.json());

// open Endpoints
app.use("/api/health", healthRouter);
app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);
// authentication Endpoints
app.use("/api/decks",requireAuth, decksRouter);
app.use("/api/decks/:deckId/cards",requireAuth, deckCardsRouter);
app.use("/api/decks/:deckId/review",requireAuth, deckReviewRouter);
app.use("/api/cards",requireAuth, cardsRouter);
app.use("/api/cards",requireAuth, cardReviewRouter);
app.use("/api/cards",requireAuth, cardCheckRouter);
app.use("/api/cards",requireAuth, cardChatRouter);
app.use("/api/stats",requireAuth, statsRouter);
export default app;
