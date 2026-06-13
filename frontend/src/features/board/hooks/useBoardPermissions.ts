import { useMemo } from "react";
import { useMe } from "../../auth/hooks/useMe";
import { useProjectMembers } from "../../project-members/hooks/useProjectMembers";
import { ProjectRole } from "../../time-logs/types";

/**
 * Derives all board UI permission flags from the current user's project role.
 *
 * Backend is always the final authority — these flags only hide/show UI
 * elements to prevent confusing UX. The server still enforces every rule.
 *
 * Permission matrix
 * ─────────────────────────────────────────────────────────────────────────
 *  Flag                │ ADMIN │ DEVELOPER │ QA   │ CLIENT
 * ─────────────────────┼───────┼───────────┼──────┼───────
 *  canCreateTask       │  ✓    │    ✓      │      │
 *  canEditTask         │  ✓    │    ✓      │  ✓   │
 *  canMoveTask (DnD)   │  ✓    │    ✓      │  ✓   │
 *  canDeleteTask       │  ✓    │           │      │
 *  canAssignAny        │  ✓    │           │      │
 *  canAssignSelf       │  ✓    │    ✓      │  ✓   │
 *  canLogTime          │  ✓    │    ✓      │  ✓   │
 *  canViewTimeLogs     │  ✓    │    ✓      │  ✓   │
 *  canViewAnalytics    │  ✓    │    ✓      │  ✓   │
 *  canManageMembers    │  ✓    │           │      │
 *  canComment          │  ✓    │    ✓      │  ✓   │  ✓
 * ─────────────────────────────────────────────────────────────────────────
 */
export const useBoardPermissions = (projectId: string) => {
  const { data: currentUser } = useMe();
  const { data: projectData, isLoading } = useProjectMembers(projectId);

  const role = useMemo<ProjectRole | undefined>(() => {
    const members = projectData?.members ?? [];
    const member = members.find((m) => {
      const uid =
        typeof m.userId === "string"
          ? m.userId
          : m.userId?._id || m.userId?.id;
      return uid === currentUser?.id;
    });
    return member?.role as ProjectRole | undefined;
  }, [projectData?.members, currentUser?.id]);

  const permissions = useMemo(() => {
    const isAdmin = role === "ADMIN";
    const isDeveloper = role === "DEVELOPER";
    const isQA = role === "QA";
    const isClient = role === "CLIENT";
    const isKnown = role !== undefined;

    return {
      role,
      isAdmin,
      isDeveloper,
      isQA,
      isClient,
      isLoading,

      // Task CRUD
      canCreateTask: isAdmin || isDeveloper,
      canEditTask: isAdmin || isDeveloper || isQA,
      canMoveTask: isAdmin || isDeveloper || isQA,
      canDeleteTask: isAdmin,

      // Assignment
      canAssignAny: isAdmin,
      canAssignSelf: isAdmin || isDeveloper || isQA,
      /** Show the assignee control at all (false for CLIENT) */
      canAssign: isAdmin || isDeveloper || isQA,

      // Time tracking
      canLogTime: isAdmin || isDeveloper || isQA,
      canViewTimeLogs: isAdmin || isDeveloper || isQA,

      // Navigation shortcuts
      canViewAnalytics: isAdmin || isDeveloper || isQA,
      canManageMembers: isAdmin,
      /** ADMIN can create, rename, and delete board sections */
      canManageSection: isAdmin,

      // Comments: everyone can comment
      canComment: isKnown,

      // Approval flow
      /** ADMIN, DEVELOPER, QA can request client review */
      canRequestApproval: isAdmin || isDeveloper || isQA,
      /** CLIENT can approve/reject; ADMIN can override */
      canApproveReject: isClient || isAdmin,

      // Attachments
      /** ADMIN, DEVELOPER, QA can add attachment metadata */
      canAddAttachment: isAdmin || isDeveloper || isQA,
      /** ADMIN can delete any attachment; uploader is checked per-item in the component */
      canDeleteAnyAttachment: isAdmin,
    };
  }, [role, isLoading]);

  return {
    ...permissions,
    currentUserId: currentUser?.id ?? "",
    projectMembers: projectData?.members ?? [],
  };
};
