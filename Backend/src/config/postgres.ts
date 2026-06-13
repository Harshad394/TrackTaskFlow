import pg from "pg";

const { Pool } = pg;

// ─── Pool singleton ───────────────────────────────────────────────────────────
let pgPool: pg.Pool | null = null;

/**
 * Attempt to connect to PostgreSQL.
 *
 * In development, a missing or unreachable PostgreSQL instance is treated as a
 * non-fatal warning so the rest of the server (MongoDB + Redis) can still start.
 * In production, failure throws so the process exits clearly.
 *
 * Existing MongoDB models are NOT touched; this pool is purely additive.
 */
const connectPostgres = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn(
      "[Postgres] DATABASE_URL is not set – PostgreSQL features will be disabled."
    );
    return;
  }

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      // Keep the pool small so idle connections don't pile up on a dev machine
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      // Give up on an individual connection attempt after 5 s
      connectionTimeoutMillis: 5_000,
      // Release idle connections after 30 s in development, 10 min in production
      idleTimeoutMillis:
        process.env.NODE_ENV === "production" ? 600_000 : 30_000,
    });

    // Validate the connection before accepting it into the pool
    const client = await pool.connect();
    const { rows } = await client.query<{ now: Date }>("SELECT NOW() AS now");
    client.release();

    console.log(
      `[Postgres] Connected. Server time: ${rows[0].now.toISOString()}`
    );

    // Surface pool-level errors so they appear in logs without crashing
    pool.on("error", (err: Error) =>
      console.error("[Postgres] Pool error:", err.message)
    );

    pgPool = pool;

    // Bootstrap the audit_logs table (idempotent – safe to run on every startup)
    // Dynamic import avoids a circular dependency (audit.service → postgres.ts → audit.service)
    const { ensureAuditTable } = await import("../services/audit.service.js");
    await ensureAuditTable();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === "production") {
      // Hard-fail in production – PostgreSQL is expected to be reachable
      throw new Error(`[Postgres] Failed to connect: ${message}`);
    }
    console.warn(
      `[Postgres] Could not connect (${message}). Running without PostgreSQL.`
    );
  }
};

// ─── Safe helper functions ────────────────────────────────────────────────────

/**
 * Returns true if the pool was successfully created (DATABASE_URL was set and
 * the initial connection probe succeeded).
 */
const isPostgresReady = (): boolean => pgPool !== null;

/**
 * Execute a parameterised query against the pool.
 * Returns null if PostgreSQL is unavailable or the query fails.
 *
 * @example
 * const rows = await pgQuery('SELECT * FROM events WHERE project_id = $1', [projectId]);
 */
const pgQuery = async <T extends pg.QueryResultRow = pg.QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T[] | null> => {
  if (!isPostgresReady()) return null;
  try {
    const result = await pgPool!.query<T>(sql, params);
    return result.rows;
  } catch (err) {
    console.error("[Postgres] Query error:", err);
    return null;
  }
};

/**
 * Obtain a raw client from the pool for multi-statement transactions.
 * Always call `client.release()` in a finally block.
 * Returns null if PostgreSQL is unavailable.
 *
 * @example
 * const client = await pgGetClient();
 * if (client) {
 *   try {
 *     await client.query('BEGIN');
 *     // ... queries ...
 *     await client.query('COMMIT');
 *   } catch {
 *     await client.query('ROLLBACK');
 *   } finally {
 *     client.release();
 *   }
 * }
 */
const pgGetClient = async (): Promise<pg.PoolClient | null> => {
  if (!isPostgresReady()) return null;
  try {
    return await pgPool!.connect();
  } catch (err) {
    console.error("[Postgres] Client acquire error:", err);
    return null;
  }
};

export { connectPostgres, pgPool, isPostgresReady, pgQuery, pgGetClient };
