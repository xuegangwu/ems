import { Router } from 'express';
import {
  getLoadForecast,
  getPriceForecast,
  getDispatchRecommendations,
  getCombinedForecast,
} from '../controllers/predictController.js';

const router = Router();

router.get('/load', getLoadForecast);
router.get('/price', getPriceForecast);
router.get('/dispatch', getDispatchRecommendations);
router.get('/combined', getCombinedForecast);

export { router as predictRoutes };
