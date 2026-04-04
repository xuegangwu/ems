import { Router } from 'express';
import {
  getLoadForecast,
  getPriceForecast,
  getDispatchRecommendations,
  getCombinedForecast,
  getSolarForecast,
  getThreeInOneForecast,
} from '../controllers/predictController.js';

const router = Router();

router.get('/load', getLoadForecast);
router.get('/price', getPriceForecast);
router.get('/dispatch', getDispatchRecommendations);
router.get('/combined', getCombinedForecast);
router.get('/solar', getSolarForecast);
router.get('/three-in-one', getThreeInOneForecast);

export { router as predictRoutes };
