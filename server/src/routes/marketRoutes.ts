import express from 'express';
import { marketController } from '../controllers/marketController.js';

export const marketRoutes = express.Router();

marketRoutes.get('/provinces', marketController);
marketRoutes.get('/pricing/:province', marketController);
marketRoutes.get('/compare', marketController);
marketRoutes.get('/solar-overlap', marketController);
