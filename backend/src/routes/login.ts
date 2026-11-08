import { Router } from 'express';
import rateLimit from 'express-rate-limit'
import validator from 'validator'
import argon2 from 'argon2'
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import {users} from "../db/schema.js";
import { signToken } from '../jwt.js';

const router = Router();
// db requests limit to 90 a min
const dbCheckLimit = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: true,
});

//login Endpoint
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
    //min and max password length
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

    // where Abfrage
    let token: string;
    try {
        const result = await db.select({password_hash: users.password_hash,user_id: users.id}).from(users).where(eq(users.email,trimmed_email)).limit(1)
        if (result[0]){
            const user_registered = await argon2.verify(result[0].password_hash,req.body.password)
            if (!user_registered){
                return res.status(401).json({
                    message: 'unauthorized',
                })
            }
            token = await signToken(result[0].user_id)
        }else{
            return res.status(401).json({
                message: 'unauthorized',
            })
        }

    } catch (error: any) {
        console.error(error)
        return res.status(500).json({
            message: 'Internal Server Error',
        })
    }
    return res.status(200).json({
        message: 'User logged in',
        token,
    })
});

export default router;