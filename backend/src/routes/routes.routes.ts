import { Router } from "express";
import { getRoutes, getRouteByDay, createRoute, updateRoute, deleteRoute } from "../controllers/routes.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All routes protected
router.use(authMiddleware);

// Get all routes
router.get('/', getRoutes);

// Get route by day
router.get('/day/:day', getRouteByDay);

// Create route
router.post('/', createRoute);

// Update route
router.put('/:id', updateRoute);

// Delete route
router.delete('/:id', deleteRoute);

export default router;