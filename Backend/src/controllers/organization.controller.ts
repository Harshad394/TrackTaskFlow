import { Response } from "express";
import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import { Authrequest } from "../middleware/auth.middleware.js";
import { createOrganizationSchema } from "../validators/organization.validator.js";

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

    const organizations = await Organization.find({
      "members.userId": req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ organizations });
  } catch {
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

