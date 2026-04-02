import { Router } from 'express';
import {
  getMarketData,
  getMarketStats,
  submitOrder,
  getOrders,
  cancelOrder,
  getPortfolio,
  getOrderBook,
} from '../controllers/tradingController.js';

const router = Router();

router.get('/market', getMarketData);
router.get('/stats', getMarketStats);
router.get('/orders', getOrders);
router.get('/portfolio', getPortfolio);
router.get('/orderbook', getOrderBook);
router.post('/orders', submitOrder);
router.delete('/orders/:id', cancelOrder);

export { router as tradingRoutes };
