import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set to a strong random value (32+ chars).');
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Session token missing or expired' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      theme_preference: user.theme_preference || 'dark',
      role: user.role || 'user',
      created_at: user.created_at
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired session token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }
  next();
}

export { JWT_SECRET };
