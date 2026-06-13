import { pgQuery, isPostgresReady } from "../config/postgres.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * All auditable action strings used across the application.
 * Add new values here as new features are built.
 */
export type AuditAction =
  | "auth:login"
  | "auth:logout"
  | "auth:register"
  | "project:created"
  | "project:updated"
  | "project:member_invited"
  | "project:member_added"
  | "project:member_removed"
  | "task:created"
  | "task:updated"
  | "task:moved"
  | "task:deleted"
  | "comment:created"
  | "comment:deleted";

/** Entity types that can appear in the audit log. */
export type AuditEntityType =
  | "user"
  | "project"
  | "task"
  | "comment"
  | "invitation"
  | "organization";

export interface AuditEventInput {
  /** MongoDB ObjectId string of the user performing the action. */
  actorUserId: string;
  /** MongoDB ObjectId string of the related organization (if any). */
  organizationId?: string | null;
  /** MongoDB ObjectId string of the related project (if any). */
  projectId?: string | null;
  /** MongoDB ObjectId string of the related task (if any). */
  taskId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  /** MongoDB ObjectId or other identifier of the primary entity affected. */
  entityId: string;
  /** Arbitrary structured context stored as JSONB. */
  metadata?: Record<string, unknown>;
}

// ─── Table bootstrap ──────────────────────────────────────────────────────────

/**
 * Creates the `audit_logs` table if it does not already exist.
 * Called once during server startup, inside `connectPostgres`.
 * Safe to call multiple times (idempotent).
 */
export const ensureAuditTable = async (): Promise<void> => {
  if (!isPostgresReady()) return;

  await pgQuery(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id               BIGSERIAL    PRIMARY KEY,
      actor_user_id    TEXT         NOT NULL,
      organization_id  TEXT,
      project_id       TEXT,
      task_id          TEXT,
      action           TEXT         NOT NULL,
      entity_type      TEXT         NOT NULL,
      entity_id        TEXT         NOT NULL,
      metadata         JSONB        NOT NULL DEFAULT '{}',
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
      ON audit_logs (actor_user_id);

    CREATE INDEX IF NOT EXISTS audit_logs_project_idx
      ON audit_logs (project_id)
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS audit_logs_task_idx
      ON audit_logs (task_id)
      WHERE task_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
      ON audit_logs (created_at DESC);
  `);

  console.log("[Audit] audit_logs table ready.");
};

// ─── Core helper ──────────────────────────────────────────────────────────────

/**
 * Insert a single audit log entry into PostgreSQL.
 *
 * - Fire-and-forget safe: never throws, never blocks the caller's response.
 * - Silent no-op if PostgreSQL is unavailable.
 *
 * @example
 * await logAuditEvent({
 *   actorUserId: req.user.userId,
 *   projectId:   project._id.toString(),
 *   action:      "project:created",
 *   entityType:  "project",
 *   entityId:    project._id.toString(),
 *   metadata:    { name: project.name, key: project.key },
 * });
 */
export const logAuditEvent = async (event: AuditEventInput): Promise<void> => {
  if (!isPostgresReady()) return;

  try {
    await pgQuery(
      `INSERT INTO audit_logs
         (actor_user_id, organization_id, project_id, task_id,
          action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.actorUserId,
        event.organizationId ?? null,
        event.projectId ?? null,
        event.taskId ?? null,
        event.action,
        event.entityType,
        event.entityId,
        JSON.stringify(event.metadata ?? {}),
      ]
    );
  } catch (err) {
    // Log the error but never let it surface to the caller
    console.error("[Audit] Failed to write audit log:", err);
  }
};
