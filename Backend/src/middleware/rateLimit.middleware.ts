import { Request, Response, NextFunction } from "express";
import { redisClient, isRedisReady } from "../config/redis.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. Default: 10 */
  limit?: number;
  /** Rolling window duration in seconds. Default: 900 (15 minutes) */
  windowSeconds?: number;
  /** Human-readable label used in the Redis key and log messages. */
  routeLabel?: string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates an Express middleware that enforces a sliding-window rate limit
 * per IP address + route label, backed by Redis INCR + EXPIRE.
 *
 * Behaviour when Redis is unavailable:
 *  - Development  → logs a warning and passes the request through.
 *  - Production   → returns 429 to be safe.
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const limit = options.limit ?? 10;
  const windowSeconds = options.windowSeconds ?? 900; // 15 minutes
  const routeLabel = options.routeLabel ?? "default";

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // ── Resolve client IP ────────────────────────────────────────────────────
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        .trim() ?? req.socket.remoteAddress ?? "unknown";

    const key = `rate_limit:${routeLabel}:${ip}`;

    // ── Redis unavailable fallback ───────────────────────────────────────────
    if (!isRedisReady()) {
      if (process.env.NODE_ENV === "production") {
        res.status(429).json({
          success: false,
          message:
            "Service temporarily unavailable. Please try again in a moment.",
        });
        return;
      }
      // Development – allow the request but warn so devs know Redis is needed
      console.warn(
        `[RateLimit] Redis unavailable – bypassing rate limit for ${routeLabel} (${ip})`
      );
      next();
      return;
    }

    // ── Sliding-window counter via INCR + EXPIRE ─────────────────────────────
    try {
      // INCR atomically increments (or initialises to 1 if the key is new)
      const current = await redisClient!.incr(key);

      if (current === 1) {
        // First request in this window – set the expiry
        await redisClient!.expire(key, windowSeconds);
      }

      // Attach standard rate-limit headers so clients can self-throttle
      const ttl = await redisClient!.ttl(key);
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - current));
      res.setHeader("X-RateLimit-Reset", Math.floor(Date.now() / 1000) + ttl);

      if (current > limit) {
        const minutes = Math.ceil(ttl / 60);
        res.status(429).json({
          success: false,
          message: `Too many requests. You have exceeded the limit of ${limit} requests per ${Math.round(windowSeconds / 60)} minutes. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
          retryAfterSeconds: ttl,
        });
        return;
      }

      next();
    } catch (err) {
      // Redis error mid-flight – degrade gracefully the same way
      console.error("[RateLimit] Redis error, bypassing rate limit:", err);
      if (process.env.NODE_ENV === "production") {
        res.status(429).json({
          success: false,
          message:
            "Service temporarily unavailable. Please try again in a moment.",
        });
        return;
      }
      next();
    }
  };
};

// ─── Pre-built limiters for auth routes ──────────────────────────────────────

/** 10 requests per 15 minutes – applied to /api/auth/login */
export const loginRateLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 900,
  routeLabel: "auth:login",
});

/** 10 requests per 15 minutes – applied to /api/auth/register */
export const registerRateLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 900,
  routeLabel: "auth:register",
});
