import { Router } from 'express';
import { uploadFile, processFile, getFiles } from '../controllers/files.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload, uploadLogger } from '../middleware/upload.middleware';

const router = Router();

// All routes protected by authentication
router.use(authMiddleware);

// Upload file with logging
router.post('/upload', 
  (req, res, next) => {
    console.log('=== ROUTE /upload HIT ===');
    next();
  },
  upload.single('file'),
  uploadLogger,
  uploadFile
);

// Process file
router.post('/:id/process', processFile);

// Get files list
router.get('/', getFiles);

export default router;
