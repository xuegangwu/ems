import { Router } from 'express';
import { alertController } from '../controllers/alertController.js';

export const alertRoutes = Router();

alertRoutes.get('/', alertController.getAll);
alertRoutes.post('/:id/acknowledge', alertController.acknowledge);
alertRoutes.post('/acknowledge-batch', alertController.acknowledgeBatch);
alertRoutes.delete('/:id', alertController.delete);
