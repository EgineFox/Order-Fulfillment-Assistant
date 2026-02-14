import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

// add user into a type Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                email: string;
            };
        }
    }
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try{
        // get token from header
        const authHeader = req.headers.authorization;
    
        if (!authHeader) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
    
        // bearer TOKEN
        const  token = authHeader.split(' ')[1];
    
        if (!token) {
            res.status(401).json({ error: "Invalid token format"});
            return;
        }
    
        // check the token
        const decoded = verifyToken(token);
    
        // add user info to the request
        req.user = decoded;
    
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token'});
    }
}