import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(70, "Organization name must not exceed 70 characters"),
});

/** Role values that exist on the Organization.members sub-document. */
export const orgMemberRoleEnum = z.enum(["OWNER", "ADMIN", "MEMBER"]);

/**
 * Body schema for POST /organizations/:organizationId/members
 * Adds an existing user (by their MongoDB user ID) with the given role.
 */
export const addOrgMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: orgMemberRoleEnum,
});

/**
 * Body schema for PATCH /organizations/:organizationId/members/:userId
 * Only the role field can be changed.
 */
export const updateOrgMemberSchema = z.object({
  role: orgMemberRoleEnum,
});
