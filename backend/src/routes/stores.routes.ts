import { Router } from 'express';
import { getStores } from '../controllers/stores.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected by authentication
router.get('/', authMiddleware, getStores);

export default router;