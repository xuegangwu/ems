import { Router } from 'express';
import { vppController } from '../controllers/vppController.js';

export const vppRoutes = Router();

vppRoutes.get('/overview', vppController.getOverview);
vppRoutes.get('/resources', vppController.getResources);
vppRoutes.post('/resources', vppController.registerResource);
vppRoutes.delete('/resources/:id', vppController.removeResource);
vppRoutes.post('/dispatch', vppController.createDispatch);
vppRoutes.get('/dispatch/orders', vppController.getOrders);
