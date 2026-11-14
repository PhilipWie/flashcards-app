import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../jwt.js';

// makes req.userId available in TypeScript
declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

// expects header "Authorization: Bearer <token>"
async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'unauthorized' });
    }
    try {
        const id = Number(await verifyToken(header.slice('Bearer '.length)));
        if (!Number.isInteger(id)){
            return res.status(401).json({ message: 'unauthorized' });
        }
        req.userId = id
        next();
    } catch {
        return res.status(401).json({ message: 'unauthorized' });
    }
}

export default requireAuth
