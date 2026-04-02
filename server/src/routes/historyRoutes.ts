import { Router } from 'express';
import {
  getDailySummaries,
  getMonthlyReport,
  getAlerts,
  acknowledgeAlert,
  getWorkOrders,
  createWorkOrder,
  getStats,
} from '../controllers/historyController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = Router();

router.get('/summaries', authMiddleware, getDailySummaries);
router.get('/report', authMiddleware, getMonthlyReport);
router.get('/stats', authMiddleware, getStats);
router.get('/alerts', authMiddleware, getAlerts);
router.post('/alerts/:id/ack', authMiddleware, acknowledgeAlert);
router.get('/work-orders', authMiddleware, getWorkOrders);
router.post('/work-orders', authMiddleware, createWorkOrder);

export { router as historyRoutes };
