import { Request, Response } from 'express';
import { SupabaseStockService } from '../services/supabase';



export class HistoryController {
  // POST /api/v1/transactions
  async createTransaction(req: Request, res: Response) {
    try {
      const transactionData = req.body;
      
      // Basic validation
      if (!transactionData.product_id) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product ID is required'
        });
      }

      if (!transactionData.transaction_type) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Transaction type is required'
        });
      }

      if (typeof transactionData.quantity_change !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Quantity change must be a number'
        });
      }

      const validTypes = ['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER'];
      if (!validTypes.includes(transactionData.transaction_type)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid transaction type'
        });
      }

      const transaction = await const stockService = new SupabaseStockService(); stockService.recordTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction recorded successfully'
      });
    } catch (error) {
      console.error('Error in createTransaction:', error);
      
      if (error instanceof Error && error.message.includes('Product not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      if (error instanceof Error && error.message.includes('below zero')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Cannot reduce quantity below zero'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/transactions/recent
  async getRecentTransactions(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await const stockService = new SupabaseStockService(); stockService.getRecentTransactions(limit);
      
      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error in getRecentTransactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions/stock-in
  async stockIn(req: Request, res: Response) {
    try {
      const { product_id, quantity, unit_cost, reference_number, notes, performed_by } = req.body;
      
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product ID and positive quantity are required'
        });
      }

      const transactionData = {
        product_id,
        transaction_type: 'IN' as const,
        quantity_change: quantity,
        unit_cost,
        reference_number,
        notes: notes || 'Stock intake',
        performed_by: performed_by || 'System'
      };

      const transaction = await const stockService = new SupabaseStockService(); stockService.recordTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Stock intake recorded successfully'
      });
    } catch (error) {
      console.error('Error in stockIn:', error);
      
      if (error instanceof Error && error.message.includes('Product not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions/stock-out
  async stockOut(req: Request, res: Response) {
    try {
      const { product_id, quantity, reference_number, notes, performed_by } = req.body;
      
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product ID and positive quantity are required'
        });
      }

      const transactionData = {
        product_id,
        transaction_type: 'OUT' as const,
        quantity_change: -quantity, // Negative for outgoing stock
        reference_number,
        notes: notes || 'Stock usage',
        performed_by: performed_by || 'System'
      };

      const transaction = await const stockService = new SupabaseStockService(); stockService.recordTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Stock usage recorded successfully'
      });
    } catch (error) {
      console.error('Error in stockOut:', error);
      
      if (error instanceof Error && error.message.includes('Product not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      if (error instanceof Error && error.message.includes('below zero')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Insufficient stock available'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions/waste
  async recordWaste(req: Request, res: Response) {
    try {
      const { product_id, quantity, reason, performed_by } = req.body;
      
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product ID and positive quantity are required'
        });
      }

      const transactionData = {
        product_id,
        transaction_type: 'WASTE' as const,
        quantity_change: -quantity, // Negative for waste
        notes: reason || 'Waste/spoilage',
        performed_by: performed_by || 'System'
      };

      const transaction = await const stockService = new SupabaseStockService(); stockService.recordTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Waste recorded successfully'
      });
    } catch (error) {
      console.error('Error in recordWaste:', error);
      
      if (error instanceof Error && error.message.includes('Product not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      if (error instanceof Error && error.message.includes('below zero')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Insufficient stock available'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/transactions/adjustment
  async recordAdjustment(req: Request, res: Response) {
    try {
      const { product_id, quantity_change, reason, performed_by } = req.body;
      
      if (!product_id || typeof quantity_change !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product ID and quantity change are required'
        });
      }

      const transactionData = {
        product_id,
        transaction_type: 'ADJUSTMENT' as const,
        quantity_change,
        notes: reason || 'Stock adjustment',
        performed_by: performed_by || 'System'
      };

      const transaction = await const stockService = new SupabaseStockService(); stockService.recordTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Stock adjustment recorded successfully'
      });
    } catch (error) {
      console.error('Error in recordAdjustment:', error);
      
      if (error instanceof Error && error.message.includes('Product not found')) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      if (error instanceof Error && error.message.includes('below zero')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Cannot reduce quantity below zero'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}