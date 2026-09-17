import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server dir or root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/nexus_student_os'),
  JWT_SECRET: z.string().default('nexus_super_secret_jwt_token_2026_student_os_system'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_EMAIL: z.string().default('mailto:notifications@nexus-os.local'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  SPOTIFY_CLIENT_ID: z.string().optional().default(''),
  SPOTIFY_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
