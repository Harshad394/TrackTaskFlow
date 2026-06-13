import { Response } from "express";
import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import {
  createOrganizationSchema,
  addOrgMemberSchema,
  updateOrgMemberSchema,
} from "../validators/organization.validator.js";
import { paginationSchema } from "../validators/pagination.validator.js";
import { buildPaginationMeta, getPaginationOptions } from "../utils/pagination.js";

export const createOrganization = async (req: Authrequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createOrganizationSchema.parse(req.body);

    const organization = await Organization.create({
      name: validatedData.name,
      ownerId: req.user.userId,
      members: [
        {
          userId: req.user.userId,
          role: "OWNER",
        },
      ],
    });

    return res.status(201).json({ organization });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listOrganizations = async (req: Authrequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);
    const query = {
      "members.userId": req.user.userId,
    };

    const [organizations, total] = await Promise.all([
      Organization.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Organization.countDocuments(query),
    ]);

    return res.status(200).json({
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
      organizations,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrganization = async (
  req: Authrequest<{ organizationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    return res.status(200).json({ organization });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Shared permission helper ─────────────────────────────────────────────────

type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

const getActorRole = (
  organization: { members: { userId: mongoose.Types.ObjectId; role: OrgRole }[] },
  actorId: string
): OrgRole | undefined =>
  organization.members.find((m) => m.userId.toString() === actorId)?.role;

const canManageMembers = (role: OrgRole | undefined): boolean =>
  role === "OWNER" || role === "ADMIN";

// ─── GET /organizations/:organizationId/members ───────────────────────────────

/**
 * List all members of an organization with paginated, populated user details.
 * Accessible by any member of the organization.
 */
export const listOrgMembers = async (
  req: Authrequest<{ organizationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    // Confirm the requester is a member
    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const pagination = paginationSchema.parse(req.query);
    const { skip, limit } = getPaginationOptions(pagination.page, pagination.limit);

    const total = organization.members.length;

    // Slice the members array for pagination, then populate user details
    const memberSlice = organization.members.slice(skip, skip + limit);
    const userIds = memberSlice.map((m) => m.userId);

    const users = await User.find({ _id: { $in: userIds } }).select("name email");
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const members = memberSlice.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: userMap.get(m.userId.toString()) ?? null,
    }));

    return res.status(200).json({
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
      members,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── POST /organizations/:organizationId/members ──────────────────────────────

/**
 * Add an existing user to the organization.
 * Requires OWNER or ADMIN role.
 * Only OWNERs can assign the OWNER role.
 */
export const addOrgMember = async (
  req: Authrequest<{ organizationId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    const validatedData = addOrgMemberSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(validatedData.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const actorRole = getActorRole(organization as any, req.user.userId);

    if (!canManageMembers(actorRole)) {
      return res.status(403).json({ message: "Only OWNER or ADMIN can add members" });
    }

    // Only OWNERs may assign the OWNER role
    if (validatedData.role === "OWNER" && actorRole !== "OWNER") {
      return res.status(403).json({ message: "Only an OWNER can assign the OWNER role" });
    }

    // Verify the target user exists
    const targetUser = await User.findById(validatedData.userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already a member
    const alreadyMember = organization.members.some(
      (m) => m.userId.toString() === validatedData.userId
    );
    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member of this organization" });
    }

    organization.members.push({
      userId: new mongoose.Types.ObjectId(validatedData.userId),
      role: validatedData.role,
    });
    await organization.save();

    return res.status(200).json({
      message: "Member added successfully",
      member: { userId: validatedData.userId, role: validatedData.role },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── PATCH /organizations/:organizationId/members/:userId ─────────────────────

/**
 * Update the role of an existing organization member.
 * Requires OWNER or ADMIN role.
 * Only OWNERs can assign or revoke the OWNER role.
 * Actors cannot demote themselves if they are the last OWNER.
 */
export const updateOrgMember = async (
  req: Authrequest<{ organizationId: string; userId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const validatedData = updateOrgMemberSchema.parse(req.body);

    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const actorRole = getActorRole(organization as any, req.user.userId);

    if (!canManageMembers(actorRole)) {
      return res.status(403).json({ message: "Only OWNER or ADMIN can update member roles" });
    }

    // Only OWNERs can assign or take away the OWNER role
    if (
      (validatedData.role === "OWNER" || /* target is currently OWNER */ false) &&
      actorRole !== "OWNER"
    ) {
      const targetMember = organization.members.find(
        (m) => m.userId.toString() === userId
      );
      if (targetMember?.role === "OWNER" || validatedData.role === "OWNER") {
        return res.status(403).json({
          message: "Only an OWNER can assign or revoke the OWNER role",
        });
      }
    }

    const targetMember = organization.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in this organization" });
    }

    // Prevent demoting the last OWNER
    if (targetMember.role === "OWNER" && validatedData.role !== "OWNER") {
      const ownerCount = organization.members.filter((m) => m.role === "OWNER").length;
      if (ownerCount <= 1) {
        return res.status(409).json({
          message: "Cannot change role: organization must have at least one OWNER",
        });
      }
    }

    targetMember.role = validatedData.role;
    await organization.save();

    return res.status(200).json({
      message: "Member role updated successfully",
      member: { userId, role: validatedData.role },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── DELETE /organizations/:organizationId/members/:userId ────────────────────

/**
 * Remove a member from the organization.
 * Requires OWNER or ADMIN role.
 * The last OWNER cannot be removed.
 * ADMINs cannot remove OWNERs or other ADMINs.
 */
export const removeOrgMember = async (
  req: Authrequest<{ organizationId: string; userId: string }>,
  res: Response
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { organizationId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const organization = await Organization.findOne({
      _id: organizationId,
      "members.userId": req.user.userId,
    });

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const actorRole = getActorRole(organization as any, req.user.userId);

    if (!canManageMembers(actorRole)) {
      return res.status(403).json({ message: "Only OWNER or ADMIN can remove members" });
    }

    const targetMember = organization.members.find(
      (m) => m.userId.toString() === userId
    );

    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in this organization" });
    }

    // ADMINs cannot remove OWNERs or other ADMINs
    if (actorRole === "ADMIN" && (targetMember.role === "OWNER" || targetMember.role === "ADMIN")) {
      return res.status(403).json({
        message: "ADMINs can only remove MEMBER-role users",
      });
    }

    // Block removal of the last OWNER
    if (targetMember.role === "OWNER") {
      const ownerCount = organization.members.filter((m) => m.role === "OWNER").length;
      if (ownerCount <= 1) {
        return res.status(409).json({
          message: "Cannot remove the last OWNER of the organization",
        });
      }
    }

    organization.members = organization.members.filter(
      (m) => m.userId.toString() !== userId
    ) as typeof organization.members;
    await organization.save();

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};
