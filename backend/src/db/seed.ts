import { Router } from 'express';
import rateLimit from 'express-rate-limit'
import { sql } from 'drizzle-orm';
import { db } from './db.js';

