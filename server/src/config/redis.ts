import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env } from './env';

let redisClient: Redis;

try {
  const realClient = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null // Don't hang trying to reconnect if not running
  });

  realClient.on('error', () => {
    // Suppress unhandled error log when offline
  });

  // Test connection or switch to mock
  realClient.connect()
    .then(() => {
      console.log('[Redis] Connected to Redis server at', env.REDIS_URL);
    })
    .catch(() => {
      console.log('[Redis] Local Redis server unavailable. Falling back to in-memory Redis mock.');
      redisClient = new RedisMock() as unknown as Redis;
    });

  redisClient = realClient;
} catch {
  console.log('[Redis] Using in-memory Redis mock.');
  redisClient = new RedisMock() as unknown as Redis;
}

export { redisClient };
