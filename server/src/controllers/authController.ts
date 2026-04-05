/**
 * 用户认证系统
 * JWT token + bcrypt 密码哈希 + 用户角色
 * 支持: admin / operator / viewer
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'operator' | 'viewer';
  displayName: string;
  stationIds: string[];
  createdAt: string;
}

// ─── Pre-computed bcrypt hashes for initial passwords ────────────────────────
// admin123 → bcrypt hash (cost 10)
// operator123 → bcrypt hash (cost 10)
// viewer123 → bcrypt hash (cost 10)
const BCRYPT_SALT_ROUNDS = 10;

const DUMMY_HASH = bcrypt.hashSync('dummy', BCRYPT_SALT_ROUNDS);

// ─── In-memory user store (生产环境请用 MongoDB/PostgreSQL) ─────────────────────
const users: User[] = [
  {
    id: 'u-001',
    username: 'admin',
    passwordHash: '$2b$10$e3GEyvDpcg7kA3vBelAzF.sM2hGe.KdJMOS8Ahr908A19AzcmLG7q', // admin123
    role: 'admin',
    displayName: '系统管理员',
    stationIds: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u-002',
    username: 'operator',
    passwordHash: '$2b$10$wZQGZJi/JnPUYBZS5KDSTesYsVD6.yP6AqZPsLL2EV4KJapVg.E3W', // operator123
    role: 'operator',
    displayName: '运维人员',
    stationIds: ['station-001', 'station-002'],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'u-003',
    username: 'viewer',
    passwordHash: '$2b$10$E/Fx74iT8hAWA2OhRRQ1C.sNPk328y8GVz.FrrFzjKHsdpJIYWL6C', // viewer123
    role: 'viewer',
    displayName: '访客用户',
    stationIds: ['station-001'],
    createdAt: '2026-02-01T00:00:00Z',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function signToken(user: User): string {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, displayName: user.displayName, stationIds: user.stationIds },
    JWT_SECRET!,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token: string): { sub: string; username: string; role: string; displayName: string; stationIds: string[] } | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

// ─── Middleware ────────────────────────────────────────────────────────────────
export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未授权，请先登录' });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, error: 'Token 无效或已过期' });
    return;
  }
  (req as any).user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ success: false, error: `需要角色权限: ${roles.join(' 或 ')}` });
      return;
    }
    next();
  };
}

// ─── API Handlers ─────────────────────────────────────────────────────────────
export function login(req: express.Request, res: express.Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    return;
  }
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
    return;
  }
  const token = signToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      stationIds: user.stationIds,
    },
  });
}

export function getProfile(req: express.Request, res: express.Response) {
  const user = (req as any).user;
  const fullUser = users.find(u => u.id === user.sub);
  if (!fullUser) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }
  res.json({
    success: true,
    user: {
      id: fullUser.id,
      username: fullUser.username,
      role: fullUser.role,
      displayName: fullUser.displayName,
      stationIds: fullUser.stationIds,
      createdAt: fullUser.createdAt,
    },
  });
}

export function listUsers(req: express.Request, res: express.Response) {
  res.json({
    success: true,
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      displayName: u.displayName,
      stationIds: u.stationIds,
      createdAt: u.createdAt,
    })),
  });
}

export function changePassword(req: express.Request, res: express.Response) {
  const user = (req as any).user;
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, error: '新密码长度至少6位' });
    return;
  }
  const fullUser = users.find(u => u.id === user.sub);
  if (!fullUser) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }
  if (!bcrypt.compareSync(oldPassword, fullUser.passwordHash)) {
    res.status(400).json({ success: false, error: '原密码错误' });
    return;
  }
  fullUser.passwordHash = bcrypt.hashSync(newPassword, BCRYPT_SALT_ROUNDS);
  res.json({ success: true, message: '密码修改成功' });
}

// ─── Utility: generate hash for a new password ───────────────────────────────
// Usage: bcrypt.hashSync('your-password', 10)
