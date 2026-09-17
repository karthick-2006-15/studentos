import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { NotificationSettings } from '../models/Notification';
import { Integration } from '../models/Integration';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const signToken = (id: string): string => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '7d' });
};

const sendTokenCookie = (res: Response, token: string) => {
  res.cookie('nexus_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, college, major, semester } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database is not connected. Please configure MONGODB_URI in your environment settings.', 503));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('An account with this email already exists', 409));
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      college: college || 'College of Engineering',
      major: major || 'Computer Science & Engineering',
      semester: semester || 5
    });

    // Initialize notification settings & integrations
    await NotificationSettings.create({ userId: user._id });
    await Integration.create({ userId: user._id });

    const token = signToken(user._id.toString());
    sendTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        major: user.major,
        semester: user.semester,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database is not connected. Please configure MONGODB_URI in your environment settings.', 503));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = signToken(user._id.toString());
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        major: user.major,
        semester: user.semester,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('nexus_token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        user: null
      });
    }

    return res.status(200).json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        college: user.college,
        major: user.major,
        semester: user.semester,
        graduationYear: user.graduationYear,
        preferences: user.preferences
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      isAuthenticated: false,
      user: null
    });
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { preferences, college, major, semester } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) return next(new AppError('User not found', 404));

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }
    if (college) user.college = college;
    if (major) user.major = major;
    if (semester) user.semester = semester;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Preferences updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        major: user.major,
        semester: user.semester,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return next(new AppError('Google credential token is required', 400));
    }

    let email = '';
    let name = '';
    let picture = '';
    let sub = '';

    // Dev & Preview test token simulation (works before Google Cloud Console credentials are set)
    if (typeof credential === 'string' && credential.startsWith('dev-mock-google-token:')) {
      const parts = credential.split(':');
      email = (parts[1] || 'google.student@nexus.io').toLowerCase();
      name = parts[2] || 'Google Student';
      sub = `google-preview-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      picture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    } else {
      // Real Google ID Token verification via Google's tokeninfo endpoint
      try {
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
          timeout: 7000
        });

        const data = response.data;
        if (!data || !data.email) {
          return next(new AppError('Invalid Google credential token payload', 401));
        }

        // Validate audience if GOOGLE_CLIENT_ID is configured
        if (env.GOOGLE_CLIENT_ID && data.aud !== env.GOOGLE_CLIENT_ID) {
          if (clientId && data.aud !== clientId) {
            return next(new AppError('Google token audience mismatch', 401));
          }
        }

        email = data.email.toLowerCase();
        name = data.name || data.given_name || email.split('@')[0];
        picture = data.picture || '';
        sub = data.sub || '';
      } catch (tokenErr: any) {
        const detail = tokenErr.response?.data?.error_description || tokenErr.response?.data?.error || tokenErr.message;
        return next(new AppError(`Failed to verify Google authentication token: ${detail}`, 401));
      }
    }

    if (!email) {
      return next(new AppError('Could not obtain verified email from Google account', 400));
    }

    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database is not connected. Please configure MONGODB_URI in your environment settings.', 503));
    }

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: sub }, { email }]
    });

    if (user) {
      let changed = false;
      if (!user.googleId && sub) {
        user.googleId = sub;
        changed = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        avatar: picture,
        googleId: sub,
        college: 'College of Engineering',
        major: 'Computer Science & Engineering',
        semester: 5,
        graduationYear: 2026
      });

      await NotificationSettings.create({ userId: user._id });
      await Integration.create({ userId: user._id });
    }

    const token = signToken(user._id.toString());
    sendTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        college: user.college,
        major: user.major,
        semester: user.semester,
        graduationYear: user.graduationYear,
        preferences: user.preferences
      }
    });
  } catch (err) {
    next(err);
  }
};
