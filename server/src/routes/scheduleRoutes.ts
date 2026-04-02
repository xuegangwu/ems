import { Router } from 'express';
import { getSchedule, getRealTimeDispatch } from '../controllers/scheduleController.js';

const router = Router();

router.get('/day', getSchedule);
router.get('/realtime', getRealTimeDispatch);

export { router as scheduleRoutes };
