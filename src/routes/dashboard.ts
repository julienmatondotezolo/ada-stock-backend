import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

// GET /api/v1/dashboard/summary - Get stock summary
router.get('/summary', dashboardController.getStockSummary.bind(dashboardController));

// GET /api/v1/dashboard/categories - Get category summaries
router.get('/categories', dashboardController.getCategorySummaries.bind(dashboardController));

// GET /api/v1/dashboard/alerts - Get stock alerts
router.get('/alerts', dashboardController.getAlerts.bind(dashboardController));

// PUT /api/v1/dashboard/alerts/:id/read - Mark alert as read
router.put('/alerts/:id/read', dashboardController.markAlertAsRead.bind(dashboardController));

// PUT /api/v1/dashboard/alerts/:id/resolve - Resolve alert
router.put('/alerts/:id/resolve', dashboardController.resolveAlert.bind(dashboardController));

// GET /api/v1/dashboard/recent-activity - Get recent activity
router.get('/recent-activity', dashboardController.getRecentActivity.bind(dashboardController));

// GET /api/v1/dashboard/stock-status - Get current stock status
router.get('/stock-status', dashboardController.getStockStatus.bind(dashboardController));

export default router;