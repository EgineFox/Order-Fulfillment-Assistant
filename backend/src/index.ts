import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import storesRoutes from './routes/stores.routes';
import routesRoutes from './routes/routes.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware 
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/routes', routesRoutes);


// Test route
app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running'
    });
});

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test: http://localhost:${PORT}/test`);
    console.log(`Auth: http://localhost:${PORT}/api/auth`);
    console.log(`Files: http://localhost:${PORT}/api/files`);
    console.log(`Stores: http://localhost:${PORT}/api/stores`);
    console.log(`JWT_SECRET loaded:`, process.env.JWT_SECRET ? 'YES' : 'NO');
});