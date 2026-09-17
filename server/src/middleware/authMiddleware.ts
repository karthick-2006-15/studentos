import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.nexus_token) {
      token = req.cookies.nexus_token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please sign in.', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('_id email name');

    if (!user) {
      return next(new AppError('User session expired or user no longer exists.', 401));
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name
    };

    next();
  } catch (err: any) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.nexus_token) {
      token = req.cookies.nexus_token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('_id email name');

    if (user) {
      req.user = {
        _id: user._id.toString(),
        email: user.email,
        name: user.name
      };
    }

    next();
  } catch {
    next();
  }
};
