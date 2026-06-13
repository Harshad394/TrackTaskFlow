import { redisClient, isRedisReady } from "../config/redis.js";

// ─── Key builders ─────────────────────────────────────────────────────────────

/**
 * Redis key for the project board cache.
 * Pattern: `cache:board:<projectId>`
 */
export const boardCacheKey = (projectId: string): string =>
  `cache:board:${projectId}`;

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Retrieve a cached JSON value by key.
 * Returns `null` if the key doesn't exist or Redis is unavailable.
 */
export const cacheGet = async <T = unknown>(key: string): Promise<T | null> => {
  if (!isRedisReady()) return null;
  try {
    const raw = await redisClient!.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[Cache] GET error for key %s:", key, err);
    return null;
  }
};

/**
 * Store a JSON-serialisable value with an explicit TTL.
 * Silently skips if Redis is unavailable.
 *
 * @param key       Redis key
 * @param value     Any JSON-serialisable value
 * @param ttlSeconds  Time-to-live in seconds
 */
export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> => {
  if (!isRedisReady()) return;
  try {
    await redisClient!.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[Cache] SET error for key %s:", key, err);
  }
};

/**
 * Delete one or more cache keys.
 * Silently skips if Redis is unavailable.
 */
export const cacheInvalidate = async (...keys: string[]): Promise<void> => {
  if (!isRedisReady()) return;
  try {
    await redisClient!.del(...keys);
    console.debug("[Cache] Invalidated key(s):", keys.join(", "));
  } catch (err) {
    console.error("[Cache] DEL error for keys %s:", keys.join(", "), err);
  }
};

// ─── Board-specific helpers ───────────────────────────────────────────────────

/** Cache TTL for the project board in seconds (30 s). */
export const BOARD_CACHE_TTL = 30;

/**
 * Invalidate the board cache for a given project.
 * Call this after any mutation that changes board state.
 */
export const invalidateBoardCache = async (projectId: string): Promise<void> => {
  await cacheInvalidate(boardCacheKey(projectId));
};
