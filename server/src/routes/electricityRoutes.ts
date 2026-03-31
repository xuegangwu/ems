import { Router } from 'express';
import { electricityController } from '../controllers/electricityController.js';

export const electricityRoutes = Router();

electricityRoutes.get('/prices', electricityController.getHalfHourlyPrices);
electricityRoutes.get('/prices/half-hourly', electricityController.getHalfHourlyPrices);
electricityRoutes.get('/prices/realtime', electricityController.getRealtimePrice);
electricityRoutes.get('/prices/prediction', electricityController.getPricePrediction);
electricityRoutes.get('/prices/regions', electricityController.getRegions);
