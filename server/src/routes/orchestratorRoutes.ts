import { Router } from 'express';
import { runOrchestration, getAgentStatus } from '../controllers/orchestratorController.js';
import { getModels, runSimulation, quickSimulate } from '../controllers/batterySimController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = Router();

router.get('/status', getAgentStatus);
router.post('/run', authMiddleware, runOrchestration);
router.get('/battery/models', getModels);
router.post('/battery/simulate', authMiddleware, runSimulation);
router.post('/battery/quick-sim', authMiddleware, quickSimulate);

export { router as orchestratorRoutes };
