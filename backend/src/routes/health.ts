import { Router } from 'express';
import { apiLimit} from "../middleware/rateLimit.js";
import { sql } from 'drizzle-orm';
import { db } from '../db/db.js';

const router = Router();

router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),          // Sekunden seit Serverstart
        timestamp: new Date().toISOString()
    })
})

router.get('/db',apiLimit, async (req, res) => {
    try {
        await db.execute(sql`select 1`);
        res.status(200).json({ status: 'ok', database: 'up' });
    } catch (err) {
        res.status(503).json({ status: 'error', database: 'down' });
    }
});
export default router;