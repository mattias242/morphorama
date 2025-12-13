import { Router, Request, Response } from 'express';
import { config } from '../config';
import { authLimiter } from '../middleware/rate-limit';
import { validate, loginSchema } from '../middleware/validation';

const router = Router();

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

// POST /api/auth/login - Login with password (with rate limiting and validation)
router.post('/login', authLimiter, validate(loginSchema), (req: Request, res: Response) => {
  const { password } = req.body;

  if (password === config.moderatorPassword) {
    req.session.authenticated = true;
    return res.json({ success: true, message: 'Logged in successfully' });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

// POST /api/auth/logout - Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/status - Check authentication status
router.get('/status', (req: Request, res: Response) => {
  res.json({ authenticated: !!req.session.authenticated });
});

export default router;
