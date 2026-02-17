import { Request, Response } from 'express';
import { SupabaseStockService } from '../services/supabase';
import { StockQueryParams } from '../models';

export class ProductsController {
  // GET /api/v1/products
  async getProducts(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const params: StockQueryParams = {
        category_id: req.query.category_id as string,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        low_stock_only: req.query.low_stock_only === 'true',
        out_of_stock_only: req.query.out_of_stock_only === 'true',
        search: req.query.search as string,
        sort_by: req.query.sort_by as any,
        sort_order: req.query.sort_order as 'asc' | 'desc',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const products = await stockService.getProducts(params);
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Error in getProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/products/:id
  async getProductById(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      const product = await stockService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error in getProductById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/products
  async createProduct(req: Request, res: Response) {
    try {
      const productData = req.body;
      
      // Basic validation
      if (!productData.name || productData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Product name is required'
        });
      }

      if (!productData.category_id) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Category ID is required'
        });
      }

      if (!productData.unit) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Unit is required'
        });
      }

      if (productData.current_quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Current quantity cannot be negative'
        });
      }

      if (productData.minimum_stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Minimum stock cannot be negative'
        });
      }

      const stockService = new SupabaseStockService();
      const product = await stockService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Error in createProduct:', error);
      
      if (error instanceof Error && error.message.includes('foreign key')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid category ID'
        });
      }
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'SKU already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/products/:id
  async updateProduct(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      const productData = req.body;
      
      // Check if product exists
      const existingProduct = await stockService.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }

      // Validation for quantities
      if (productData.current_quantity !== undefined && productData.current_quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Current quantity cannot be negative'
        });
      }

      if (productData.minimum_stock !== undefined && productData.minimum_stock < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Minimum stock cannot be negative'
        });
      }

      const product = await stockService.updateProduct(id, productData);
      
      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Error in updateProduct:', error);
      
      if (error instanceof Error && error.message.includes('foreign key')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid category ID'
        });
      }
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'SKU already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/v1/products/:id
  async deleteProduct(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      
      // Check if product exists
      const existingProduct = await stockService.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Product not found'
        });
      }

      await stockService.deleteProduct(id);
      
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/products/:id/quantity
  async updateQuantity(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Quantity must be a non-negative number'
        });
      }

      const product = await stockService.updateProduct(id, { current_quantity: quantity });
      
      res.json({
        success: true,
        data: product,
        message: 'Product quantity updated successfully'
      });
    } catch (error) {
      console.error('Error in updateQuantity:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/products/:id/adjust
  async adjustQuantity(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      const { quantity_change, reason, performed_by } = req.body;
      
      if (typeof quantity_change !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Quantity change must be a number'
        });
      }

      const transactionData = {
        product_id: id,
        transaction_type: 'ADJUSTMENT' as const,
        quantity_change,
        notes: reason || 'Manual adjustment',
        performed_by: performed_by || 'System'
      };

      const transaction = await stockService.recordTransaction(transactionData);
      
      res.json({
        success: true,
        data: transaction,
        message: 'Product quantity adjusted successfully'
      });
    } catch (error) {
      console.error('Error in adjustQuantity:', error);
      
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

  // GET /api/v1/products/:id/history
  async getProductHistory(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const history = await stockService.getProductHistory(id, limit);
      
      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      console.error('Error in getProductHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/products/low-stock
  async getLowStockProducts(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const products = await stockService.getProducts({ low_stock_only: true });
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Error in getLowStockProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/products/out-of-stock
  async getOutOfStockProducts(req: Request, res: Response) {
    try {
      const stockService = new SupabaseStockService();
      const products = await stockService.getProducts({ out_of_stock_only: true });
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('Error in getOutOfStockProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}