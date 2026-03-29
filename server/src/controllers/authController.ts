import { Request, Response } from 'express';

export const authController = {
  login: (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  },
  register: (req: Request, res: Response) => {
    const user = { id: `user-${Date.now()}`, ...req.body };
    res.json({ success: true, data: user });
  },
  getProfile: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
    });
  },
};
