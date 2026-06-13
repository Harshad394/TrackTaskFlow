import { Redis } from "ioredis";

// ─── Client singleton ────────────────────────────────────────────────────────
let redisClient: Redis | null = null;

/**
 * Attempt to connect to Redis.
 * In development, a missing / unreachable Redis instance is treated as a
 * non-fatal warning so the rest of the server can still start.
 */
const connectRedis = async (): Promise<void> => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn(
      "[Redis] REDIS_URL is not set – Redis features will be disabled."
    );
    return;
  }

  try {
    const client = new Redis(redisUrl, {
      // Fail fast on first attempt; don't block server startup
      lazyConnect: true,
      // Retry strategy: give up after 3 attempts in development
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (process.env.NODE_ENV === "production") {
          // Exponential back-off capped at 10 s in production
          return Math.min(times * 200, 10_000);
        }
        // In development, stop retrying after 3 attempts
        if (times > 3) return null;
        return times * 500;
      },
    });

    // Attach event listeners before connecting
    client.on("connect", () => console.log("[Redis] Connected."));
    client.on("ready", () => console.log("[Redis] Ready."));
    client.on("error", (err: Error) =>
      console.error("[Redis] Error:", err.message)
    );
    client.on("close", () => console.warn("[Redis] Connection closed."));
    client.on("reconnecting", () => console.log("[Redis] Reconnecting…"));

    await client.connect();
    redisClient = client;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === "production") {
      // Hard-fail in production – Redis is expected to be available
      throw new Error(`[Redis] Failed to connect: ${message}`);
    }
    console.warn(
      `[Redis] Could not connect (${message}). Running without Redis.`
    );
  }
};

// ─── Safe helper functions ───────────────────────────────────────────────────

/**
 * Returns true if the Redis client is connected and ready.
 */
const isRedisReady = (): boolean =>
  redisClient !== null && redisClient.status === "ready";

/**
 * Safely get a value by key. Returns null if Redis is unavailable.
 */
const redisGet = async (key: string): Promise<string | null> => {
  if (!isRedisReady()) return null;
  try {
    return await redisClient!.get(key);
  } catch (err) {
    console.error("[Redis] GET error:", err);
    return null;
  }
};

/**
 * Safely set a key/value pair with an optional TTL (in seconds).
 * Returns false if Redis is unavailable.
 */
const redisSet = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> => {
  if (!isRedisReady()) return false;
  try {
    if (ttlSeconds !== undefined) {
      await redisClient!.set(key, value, "EX", ttlSeconds);
    } else {
      await redisClient!.set(key, value);
    }
    return true;
  } catch (err) {
    console.error("[Redis] SET error:", err);
    return false;
  }
};

/**
 * Safely delete one or more keys.
 * Returns the number of keys deleted, or 0 if Redis is unavailable.
 */
const redisDel = async (...keys: string[]): Promise<number> => {
  if (!isRedisReady()) return 0;
  try {
    return await redisClient!.del(...keys);
  } catch (err) {
    console.error("[Redis] DEL error:", err);
    return 0;
  }
};

export { connectRedis, redisClient, isRedisReady, redisGet, redisSet, redisDel };
