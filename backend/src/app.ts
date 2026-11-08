import express from 'express';
import healthRouter from './routes/health.js'
import registerRouter from './routes/register.js'
import loginRouter from './routes/login.js'

const app = express();
app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/register", registerRouter);
app.use("/api/login", loginRouter);

export default app;
