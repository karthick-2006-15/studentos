import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

let isConnecting = false;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  if (isConnecting || mongoose.connection.readyState === 2) {
    await new Promise<void>((resolve) => {
      const onDone = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        mongoose.connection.removeListener('connected', onDone);
        mongoose.connection.removeListener('error', onDone);
      };
      mongoose.connection.once('connected', onDone);
      mongoose.connection.once('error', onDone);
      setTimeout(onDone, 10000);
    });
    return;
  }

  try {
    isConnecting = true;
    // Windows SRV record DNS resolution fix (ONLY run on Windows; Cloud Run/Linux must use system resolver)
    if (process.platform === 'win32') {
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
      } catch {
        // Ignore if setServers not permitted
      }
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true
    });

    console.log('[Database] MongoDB connected successfully to:', mongoose.connection.name);
  } catch (error: any) {
    console.error('[Database] MongoDB connection failed:', error.message);
  } finally {
    isConnecting = false;
  }
};
