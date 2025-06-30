
import { Request, Response, NextFunction } from 'express';

export const sessionAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.cookies.access_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};
