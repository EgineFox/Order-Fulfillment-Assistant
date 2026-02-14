import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all routes
export const getRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    const routes = await prisma.deliveryRoute.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    res.json({ routes });
  } catch (error) {
    console.error('GetRoutes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get route by day
export const getRouteByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const dayParam = req.params.day as string;
    const dayOfWeek = parseInt(dayParam, 10);

    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: 'Invalid day of week (0-6)' });
      return;
    }

    const route = await prisma.deliveryRoute.findFirst({
      where: { dayOfWeek, isActive: true },
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json({ route });
  } catch (error) {
    console.error('GetRouteByDay error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create route
export const createRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dayOfWeek, stores } = req.body;

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: 'Invalid day of week (0-6)' });
      return;
    }

    if (!stores || typeof stores !== 'string') {
      res.status(400).json({ error: 'Stores must be a comma-separated string' });
      return;
    }

    const route = await prisma.deliveryRoute.create({
      data: {
        dayOfWeek,
        stores,
        isActive: true,
      },
    });

    res.status(201).json({ route });
  } catch (error) {
    console.error('CreateRoute error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update route
export const updateRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id as string;
    const id = parseInt(idParam, 10);
    const { dayOfWeek, stores, isActive } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    const updateData: any = {};
    if (typeof dayOfWeek === 'number') updateData.dayOfWeek = dayOfWeek;
    if (typeof stores === 'string') updateData.stores = stores;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const route = await prisma.deliveryRoute.update({
      where: { id },
      data: updateData,
    });

    res.json({ route });
  } catch (error) {
    console.error('UpdateRoute error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete route
export const deleteRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id as string;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    await prisma.deliveryRoute.delete({
      where: { id },
    });

    res.json({ message: 'Route deleted' });
  } catch (error) {
    console.error('DeleteRoute error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};