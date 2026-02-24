import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import prisma from '../config/database';
import { parseExcelFile, ParseResult } from '../services/fileProcessor.service';
import { OrderRow } from '../types';
import { distributeOrders } from '../services/distribution.service';

// Upload file
export const uploadFile = async (req: Request, res: Response): Promise<void> => {

  try {
    
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    console.log('File uploaded:', req.file.filename);
    
    // Save file info to database
    const fileUpload = await prisma.fileUpload.create({
      data: {
        userId: userId,
        filename: req.file.filename,
        status: 'pending',
      }
    });
    
    console.log('File saved to DB with ID:', fileUpload.id);
    
    res.status(201).json({
      fileId: fileUpload.id,
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: fileUpload.uploadedAt,
    });
    
    console.log('Response sent');
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Process file
export const processFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const fileId = parseInt(req.params.id as string, 10);
        const { excludedStores } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        console.log('Processing file:', fileId);
        if (excludedStores && excludedStores.length > 0) {
           }

        // Get info about file
        const fileUpload = await prisma.fileUpload.findUnique({
            where: { id: fileId }
        });

        if (!fileUpload) {
            res.status(404).json({error: 'File not found'});
            return;
        }
        if (fileUpload.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // File path
        const filePath = path.join(__dirname, '../../uploads', fileUpload.filename);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File not found on disk' });
            return;
        }

        // Parse Excel
        const parseResult:ParseResult  = parseExcelFile(filePath);
        const { validOrders, errors: parseErrors } = parseResult;

        console.log(`Valid: ${validOrders.length}, Errors: ${parseErrors.length}`);
        if (validOrders.length === 0) {
      await prisma.fileUpload.update({
        where: { id: fileId },
        data: {
          status: 'error',
          processedAt: new Date(),
        }
      });
      
      res.status(400).json({
        error: 'The file does not contain valid data',
        parseErrors: parseErrors
      });
      return;
    }

        // Save to DB
        await prisma.orderItem.createMany({
            data: validOrders.map((order: OrderRow) => ({
                fileUploadId: fileId,
                externalId: order.externalId,
                orderName: order.orderName,
                shippingAddress: order.shippingAddress,
                shippingPhone: order.shippingPhone,
                shippingCity: order.shippingCity,
                customerName: order.customerName,
                orderDate: order.orderDate,
                sku: order.sku,
                barcode: order.barcode ? String(order.inventory) : null,
                productName: order.productName,
                quantity: order.quantity,
                inventoryRaw: order.inventory ? String(order.inventory) : null,
                locationCode: order.location ? String(order.location) : null,
            }))
        });

        // Update file status
        await prisma.fileUpload.update({
            where: { id: fileId },
            data: {
                status: 'processed',
                processedAt: new Date(),
                totalRows: validOrders.length,
            }
        });

        console.log('File processed successfully');

// Run the distribution algorithm
// For now, use current date
const deliveryDate = new Date();
const results = await distributeOrders(validOrders, deliveryDate, excludedStores);

      console.log('Distribution completed');
// Return results + parsing errors

       res.json({
      message: 'File processed successfully',
      totalRows: validOrders.length,
      fileId: fileId,
      results: results,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined  // Only if there is
    });
    
  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
};

// Get a list of user files
export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const files = await prisma.fileUpload.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        filename: true,
        uploadedAt: true,
        processedAt: true,
        status: true,
        totalRows: true,
      }
    });
    
    res.json({ files });
    
  } catch (error) {
    console.error('GetFiles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
