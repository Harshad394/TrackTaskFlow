import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Project, { IProject, ProjectMemberRole } from "../models/project.model.js";
import Section, { ISection } from "../models/section.model.js";
import Task, { ITask } from "../models/task.model.js";
import Sprint, { ISprint } from "../models/sprint.model.js";
import { Authrequest } from "./auth.middleware.js";

export interface ProjectAuthRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Authrequest<Params, ResBody, ReqBody, ReqQuery> {
  project?: IProject;
  section?: ISection;
  task?: ITask;
  sprint?: ISprint;
  projectRole?: ProjectMemberRole;
}

const findMemberRole = (project: IProject, userId: string) => {
  return project.members.find((member) => member.userId.toString() === userId)
    ?.role;
};

export const requireProjectRole = (allowedRoles: ProjectMemberRole[]) => {
  return async (
    req: ProjectAuthRequest<{ projectId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { projectId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: "Invalid project" });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const role = findMemberRole(project, req.user.userId);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Project access denied" });
      }

      req.project = project;
      req.projectRole = role;
      next();
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export const requireTaskProjectRole = (allowedRoles: ProjectMemberRole[]) => {
  return async (
    req: ProjectAuthRequest<{ taskId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { taskId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Invalid task" });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const role = findMemberRole(project, req.user.userId);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Project access denied" });
      }

      req.task = task;
      req.project = project;
      req.projectRole = role;
      next();
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export const requireSectionProjectRole = (allowedRoles: ProjectMemberRole[]) => {
  return async (
    req: ProjectAuthRequest<{ sectionId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { sectionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sectionId)) {
        return res.status(400).json({ message: "Invalid section" });
      }

      const section = await Section.findById(sectionId);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      const project = await Project.findById(section.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const role = findMemberRole(project, req.user.userId);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Project access denied" });
      }

      req.section = section;
      req.project = project;
      req.projectRole = role;
      next();
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

/**
 * Resolves the project from a sprint-scoped route (/sprints/:sprintId/...).
 * Populates req.sprint and req.project so controllers don't need to re-fetch them.
 */
export const requireSprintProjectRole = (allowedRoles: ProjectMemberRole[]) => {
  return async (
    req: ProjectAuthRequest<{ sprintId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { sprintId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sprintId)) {
        return res.status(400).json({ message: "Invalid sprint" });
      }

      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }

      const project = await Project.findById(sprint.project);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const role = findMemberRole(project, req.user.userId);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Project access denied" });
      }

      req.sprint = sprint;
      req.project = project;
      req.projectRole = role;
      next();
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};
