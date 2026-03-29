import { Router } from 'express';
import { authController } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.post('/register', authController.register);
authRoutes.get('/profile', authController.getProfile);
