import express from 'express';
import healthRouter from './routes/health.js'
import registerRouter from './routes/register.js'
import loginRouter from './routes/login.js'
import decksRouter from './routes/decks.js'
import { deckCardsRouter, cardsRouter } from './routes/cards.js'
import { deckReviewRouter, cardReviewRouter } from './routes/review.js'
import requireAuth from './middleware/auth.js'

const app = express();
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
export default app;
