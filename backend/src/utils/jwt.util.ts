import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_123456789';
const JWT_EXPIRES_IN = '7d';

console.log('🔑 JWT_SECRET:', JWT_SECRET);

export const generateToken = ( userId: number, email: string): string => {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = ( token: string): any =>  {
    try {
        return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
};