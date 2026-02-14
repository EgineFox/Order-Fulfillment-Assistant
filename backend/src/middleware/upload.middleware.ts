import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory:', uploadDir);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Setting destination...');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log('Generating filename...');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter - only Excel
const fileFilter = (req: any, file: any, cb: any) => {
  console.log('File filter called');
  console.log('File:', file.originalname, 'Type:', file.mimetype);
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  console.log('Extension:', ext);
  
  if (allowedExtensions.includes(ext)) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected');
    cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed!'), false);
  }
};

// Export multer middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
});

// Log middleware
export const uploadLogger = (req: any, res: any, next: any) => {
  console.log('=== AFTER MULTER ===');
  console.log('req.file:', req.file);
  console.log('Calling next()...');
  next();
};
