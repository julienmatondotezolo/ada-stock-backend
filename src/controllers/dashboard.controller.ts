import { Request, Response } from 'express';
import { SupabaseStockService } from '../services/supabase';



export class DashboardController {
  // GET /api/v1/dashboard/summary
  async getStockSummary(req: Request, res: Response) {
    try {
      const summary = await const stockService = new SupabaseStockService(); stockService.getStockSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getStockSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/dashboard/categories
  async getCategorySummaries(req: Request, res: Response) {
    try {
      const summaries = await const stockService = new SupabaseStockService(); stockService.getCategorySummaries();
      
      res.json({
        success: true,
        data: summaries,
        count: summaries.length
      });
    } catch (error) {
      console.error('Error in getCategorySummaries:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/dashboard/alerts
  async getAlerts(req: Request, res: Response) {
    try {
      const unreadOnly = req.query.unread_only === 'true';
      const alerts = await const stockService = new SupabaseStockService(); stockService.getAlerts(unreadOnly);
      
      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      console.error('Error in getAlerts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/dashboard/alerts/:id/read
  async markAlertAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await const stockService = new SupabaseStockService(); stockService.markAlertAsRead(id);
      
      res.json({
        success: true,
        message: 'Alert marked as read'
      });
    } catch (error) {
      console.error('Error in markAlertAsRead:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/dashboard/alerts/:id/resolve
  async resolveAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await const stockService = new SupabaseStockService(); stockService.resolveAlert(id);
      
      res.json({
        success: true,
        message: 'Alert resolved'
      });
    } catch (error) {
      console.error('Error in resolveAlert:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/dashboard/recent-activity
  async getRecentActivity(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await const stockService = new SupabaseStockService(); stockService.getRecentTransactions(limit);
      
      // Transform for dashboard display
      const activity = transactions.map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type,
        product_name: transaction.product?.name,
        quantity_change: transaction.quantity_change,
        unit: transaction.product?.unit || 'pcs',
        performed_by: transaction.performed_by,
        transaction_date: transaction.transaction_date,
        notes: transaction.notes
      }));
      
      res.json({
        success: true,
        data: activity,
        count: activity.length
      });
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/dashboard/stock-status
  async getStockStatus(req: Request, res: Response) {
    try {
      const [outOfStockProducts, lowStockProducts] = await Promise.all([
        const stockService = new SupabaseStockService(); stockService.getProducts({ out_of_stock_only: true }),
        const stockService = new SupabaseStockService(); stockService.getProducts({ low_stock_only: true })
      ]);
      
      const stockStatus = {
        out_of_stock: outOfStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category?.name,
          quantity: product.current_quantity,
          unit: product.unit,
          minimum_stock: product.minimum_stock
        })),
        low_stock: lowStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category?.name,
          quantity: product.current_quantity,
          unit: product.unit,
          minimum_stock: product.minimum_stock
        }))
      };
      
      res.json({
        success: true,
        data: stockStatus
      });
    } catch (error) {
      console.error('Error in getStockStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/health
  async healthCheck(req: Request, res: Response) {
    try {
      // Basic health check - try to connect to database
      const categories = await const stockService = new SupabaseStockService(); stockService.getCategories();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          api: 'operational'
        },
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'operational'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}