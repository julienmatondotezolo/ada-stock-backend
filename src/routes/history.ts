import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';

const router = Router();
const historyController = new HistoryController();

// GET /api/v1/transactions/recent - Get recent transactions
router.get('/recent', historyController.getRecentTransactions.bind(historyController));

// POST /api/v1/transactions - Create new transaction
router.post('/', historyController.createTransaction.bind(historyController));

// POST /api/v1/transactions/stock-in - Record stock intake
router.post('/stock-in', historyController.stockIn.bind(historyController));

// POST /api/v1/transactions/stock-out - Record stock usage/outgoing
router.post('/stock-out', historyController.stockOut.bind(historyController));

// POST /api/v1/transactions/waste - Record waste/spoilage
router.post('/waste', historyController.recordWaste.bind(historyController));

// POST /api/v1/transactions/adjustment - Record stock adjustment
router.post('/adjustment', historyController.recordAdjustment.bind(historyController));

export default router;