import { Router } from 'express';
import { getRealtime, getHistory, getStations, getMQTTStatus } from '../controllers/mqttController.js';

const router = Router();
router.get('/realtime', getRealtime);
router.get('/history', getHistory);
router.get('/stations', getStations);
router.get('/status', getMQTTStatus);

export { router as mqttRoutes };
