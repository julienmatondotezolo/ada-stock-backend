import { Router } from 'express';
import categoriesRoutes from './categories';
import productsRoutes from './products';
import historyRoutes from './history';
import dashboardRoutes from './dashboard';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

// Health check endpoint
router.get('/health', dashboardController.healthCheck.bind(dashboardController));

// API routes
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/transactions', historyRoutes);
router.use('/dashboard', dashboardRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Ada Stock Management API',
    version: '1.0.0',
    description: 'REST API for L\'Osteria Restaurant Stock Management System',
    endpoints: {
      health: 'GET /health',
      categories: {
        list: 'GET /categories',
        get: 'GET /categories/:id',
        create: 'POST /categories',
        update: 'PUT /categories/:id',
        delete: 'DELETE /categories/:id',
        summary: 'GET /categories/:id/summary'
      },
      products: {
        list: 'GET /products',
        get: 'GET /products/:id',
        create: 'POST /products',
        update: 'PUT /products/:id',
        delete: 'DELETE /products/:id',
        updateQuantity: 'POST /products/:id/quantity',
        adjustQuantity: 'POST /products/:id/adjust',
        history: 'GET /products/:id/history',
        lowStock: 'GET /products/low-stock',
        outOfStock: 'GET /products/out-of-stock'
      },
      transactions: {
        create: 'POST /transactions',
        recent: 'GET /transactions/recent',
        stockIn: 'POST /transactions/stock-in',
        stockOut: 'POST /transactions/stock-out',
        waste: 'POST /transactions/waste',
        adjustment: 'POST /transactions/adjustment'
      },
      dashboard: {
        summary: 'GET /dashboard/summary',
        categories: 'GET /dashboard/categories',
        alerts: 'GET /dashboard/alerts',
        markAlertRead: 'PUT /dashboard/alerts/:id/read',
        resolveAlert: 'PUT /dashboard/alerts/:id/resolve',
        recentActivity: 'GET /dashboard/recent-activity',
        stockStatus: 'GET /dashboard/stock-status'
      }
    }
  });
});

export default router;