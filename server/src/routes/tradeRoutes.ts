import { Router } from 'express';
import { tradeController } from '../controllers/tradeController.js';

export const tradeRoutes = Router();

tradeRoutes.get('/orders', tradeController.getOrders);
tradeRoutes.post('/orders', tradeController.createOrder);
tradeRoutes.delete('/orders/:id', tradeController.cancelOrder);
tradeRoutes.get('/prices', tradeController.getPrices);
