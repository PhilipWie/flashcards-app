import { Router } from 'express';
import { apiLimit } from "../middleware/rateLimit.js";
import { db } from '../db/db.js';
import {decks} from "../db/schema.js";
import { eq } from 'drizzle-orm';
import { and } from "drizzle-orm";

const router = Router();
//GET: gets all decks of the logged in user
router.get('/', apiLimit,async (req, res) => {
    try {
        const user_id = Number(req.userId)

        const res_decks = await db.select({id: decks.id,name: decks.name}).from(decks).where(eq(decks.user_id,user_id));
        return res.status(200).json({
            decks: res_decks
        })
    } catch (error: any) {
        console.error(error)
        return res.status(500).json({
            message: 'Internal Server Error',
        })
    }
});

//POST: Creates new Deck
router.post('/',apiLimit, async (req, res) => {
    if (req.body == undefined || typeof req.body != "object") {
        return res.status(400).json({
            message: 'wrong format of input data',
        });
    }
    const deck_name = req.body.name
    const user_id = Number(req.userId)
    if (typeof deck_name != "string") {
        return res.status(400).json({
            message: 'Deck name is not a string',
        })
    }
    const trimmed_name = deck_name.trim()
    if (trimmed_name.length < 1 || trimmed_name.length > 60) {
        return res.status(400).json({
            message: 'validation error',
        })
    }
    try {
        const result = await db.insert(decks).values({name: trimmed_name, user_id: user_id}).returning({
            id: decks.id,
            name: decks.name
        })
        return res.status(201).json({
            deck: result[0]
        });
    }catch(err: any) {
        console.error(err)
        return res.status(500).json({
            message: 'Internal Server Error',
        })
    }
});
//Patch: changes the decks name
router.patch('/:id', apiLimit, async (req, res) => {
    if (req.body == undefined || typeof req.body != "object") {
        return res.status(400).json({
            message: 'wrong format of input data',
        });
    }
    const deck_id = Number(req.params.id);
    if (!Number.isInteger(deck_id) || deck_id <= 0) {
        return res.status(400).json({
            message: 'validation error',
        })
    }
    const deck_name = req.body.name
    if (typeof deck_name != "string") {
        return res.status(400).json({
            message: 'Deck name is not a string',
        })
    }
    const trimmed_name = deck_name.trim()
    if (trimmed_name.length < 1 || trimmed_name.length > 60) {
        return res.status(400).json({
            message: 'validation error',
        })
    }
    try {
        const user_id = Number(req.userId)
        const result = await db.update(decks)
            .set({name: trimmed_name})
            .where(and(eq(decks.id, deck_id), eq(decks.user_id, user_id)))
            .returning({id: decks.id, name: decks.name})
        if (result.length === 0) {
            return res.status(404).json({
                message: 'deck not found',
            })
        }
        return res.status(200).json({
            deck: result[0]
        })
    } catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: 'Internal Server Error',
        })
    }
});

// Delete Route: löscht das Deck des angemeldeten Users miit der mitgegebenen id
router.delete('/:id', apiLimit, async (req, res) => {
    try {
        if (typeof req.userId == "undefined"){
            return res.status(401).json({
                message: 'wrong format of input data',
            })
        }
        const user_id = Number(req.userId)

        const deck_id = Number(req.params.id);
        if (!Number.isInteger(deck_id) || deck_id <= 0) {
            return res.status(400).json({
                message: 'validation error',
            })
        }
        const result = await db.delete(decks).where(and(eq(decks.id,deck_id), eq(decks.user_id,user_id))).returning();
        if (result.length === 0){ return res.status(404).json("deck not found") }
        return res.status(200).json({
            message: `Deck ${deck_id} deleted`,
        })
    }catch (err: any) {
        console.error(err)
        return res.status(500).json({
            message: 'Internal Server Error',
        })
    }
});

export default router;