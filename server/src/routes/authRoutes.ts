import { Router } from 'express';
import { login, getProfile, listUsers, changePassword, authMiddleware, requireRole } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/password', authMiddleware, changePassword);
router.get('/users', authMiddleware, requireRole('admin'), listUsers);

export { router as authRoutes };
