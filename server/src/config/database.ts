import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Windows SRV record DNS resolution fix
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch {
      // Ignore if setServers not permitted
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000
    });

    console.log('[Database] MongoDB connected successfully to:', mongoose.connection.name);
  } catch (error: any) {
    console.error('[Database] MongoDB connection failed:', error.message);
    // Do not terminate process immediately in dev so developers can see what's happening
  }
};
