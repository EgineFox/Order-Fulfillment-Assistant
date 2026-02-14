import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all stores
export const getStores = async (req: Request, res: Response): Promise<void> => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        managerName: true,
        managerPhone: true,
        isMainWarehouse: true,
      }
    });
    
    res.json({ stores });
    
  } catch (error) {
    console.error('GetStores error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};