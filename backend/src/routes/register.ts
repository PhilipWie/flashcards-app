import { Router } from 'express';
import rateLimit from 'express-rate-limit'
import validator from 'validator'
import argon2 from 'argon2'
import { sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import {users} from "../db/schema.js";

const router = Router();
// db requests limit to 90 a min
const dbCheckLimit = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: true,
});

//register Endpoint
router.post("/",dbCheckLimit, async (req, res) => {
    //check for undefined and data which is not an object
    if (req.body == undefined || typeof req.body != "object") {
        return res.status(400).json({
            message: 'validation error',
        });
    }
    //check that email and password are strings
    if (typeof req.body.email !== "string" || typeof req.body.password !== "string") {
        return res.status(400).json({
            message: 'Input is not type string'
        });
    }
    //password should be atleast 6 or max. 500 digits
    if (req.body.password.length < 6 || req.body.password.length > 500) {
        return res.status(400).json({
            message: 'bad request (password must be at least 6 characters)'
        })
    }
    //RFC email limit 254
    const trimmed_email = req.body.email.toLowerCase().trim();
    if (trimmed_email.length < 6 || trimmed_email.length > 254) {
        return res.status(400).json({
            message: 'bad request (email must be at least 6 characters)'
        })
    }
    //check correct email format with npm validator lib
    if (!validator.isEmail(trimmed_email)) {
        return res.status(400).json({
            message: 'email is not in a correct format',
        })
    }
    //hashes password and inserts trimmed_email and password_hash to the db
    try {
        const password_hash = await hashPassword(req.body.password);
        await db.insert(users).values({email: trimmed_email, password_hash: password_hash})
    } catch (error: any) {
        if (error.cause.code === '23505') {
            return res.status(409).json({
                message: 'Duplicate email detected try another email or login',
            })
        } else {
            console.error(error)
            return res.status(500).json({
                message: 'Internal Server Error',
            })
        }
    }
    return res.status(201).json({
        message: 'User registered',
    })
});
// password hash function logik with lib argon2
async function hashPassword(password: string): Promise<string> {
    try {
        const hashedPassword = await argon2.hash(password);
        return hashedPassword
    } catch (error) {
        console.error("Error while hashing:", error);
        throw error;
    }
}

export default router;