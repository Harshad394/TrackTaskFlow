import { ProjectMember, ProjectMemberUser } from "./types";

export const getUserId = (user: string | ProjectMemberUser) => {
  return typeof user === "string" ? user : user._id || user.id || "";
};

export const getMemberName = (member: ProjectMember) => {
  if (typeof member.userId === "string") return "Project member";
  return member.userId.name || member.userId.email || "Project member";
};

export const getMemberEmail = (member: ProjectMember) => {
  if (typeof member.userId === "string") return member.userId;
  return member.userId.email;
};

export const roleOptions = ["ADMIN", "DEVELOPER", "QA", "CLIENT"] as const;
