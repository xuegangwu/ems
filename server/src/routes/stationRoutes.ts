import { Router } from 'express';
import { stationController } from '../controllers/stationController.js';

export const stationRoutes = Router();

stationRoutes.get('/', stationController.getAll);
stationRoutes.get('/:id', stationController.getById);
stationRoutes.post('/', stationController.create);
stationRoutes.put('/:id', stationController.update);
stationRoutes.delete('/:id', stationController.delete);
