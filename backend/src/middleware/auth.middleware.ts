import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to require authentication
 * Checks if user is authenticated via session
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.authenticated) {
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource',
  });
};
