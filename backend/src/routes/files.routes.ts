import { Router } from 'express';
import { uploadFile, processFile, getFiles } from '../controllers/files.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// All routes protected by authentication
router.use(authMiddleware);

// Upload file
router.post('/upload', upload.single('file'),
  uploadFile
);

// Process file
router.post('/:id/process', processFile);

// Get files list
router.get('/', getFiles);

export default router;
