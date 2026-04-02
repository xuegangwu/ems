import { Router } from 'express';
import { getMqttConfig, setMqttConfig, getStations, saveTelemetry, getHistory, getAlerts, ackAlert, getDailySummary } from '../controllers/storeController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = Router();
router.get('/mqtt-config', getMqttConfig);
router.put('/mqtt-config', authMiddleware, setMqttConfig);
router.get('/stations', getStations);
router.post('/telemetry', saveTelemetry);
router.get('/history/:stationId', getHistory);
router.get('/alerts', authMiddleware, getAlerts);
router.put('/alerts/:id/ack', authMiddleware, ackAlert);
router.get('/daily-summary', authMiddleware, getDailySummary);

export default router;
