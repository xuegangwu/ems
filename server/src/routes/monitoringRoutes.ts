import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController.js';

export const monitoringRoutes = Router();

monitoringRoutes.get('/:stationId/realtime', monitoringController.getRealTimeData);
monitoringRoutes.get('/:stationId/history', monitoringController.getHistoricalData);
