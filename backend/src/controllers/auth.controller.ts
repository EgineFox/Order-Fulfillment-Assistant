import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt.util';
import { RegisterRequest, LoginRequest } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name }: RegisterRequest = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are requared'});
            return;
        }

        // Check existing of user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: 'User already exists'});
            return;
        }

        // Hashing password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        // Generate token
        const token = generateToken(user.id, user.email);

        // Sent response
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Register  error:', error);
        res.status(500).json({ error: 'Server error'});
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;
        
        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials'});
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials'});
            return;
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        // Send response
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Server error"});

    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user adding to the authMiddleware
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: "Unauthorized"});
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found'});
            return;
        }

        res.json({ user });

    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Server error'});
    }
};