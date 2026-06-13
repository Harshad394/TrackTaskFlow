import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

const password = "Password1!";

const unique = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const registerUser = async (namePrefix = "Test User") => {
  const agent = request.agent(app);
  const email = `${unique(namePrefix.toLowerCase().replace(/\s+/g, "-"))}@example.com`;

  const response = await agent
    .post("/api/auth/register")
    .send({
      name: namePrefix,
      email,
      password,
    })
    .expect(201);

  return {
    agent,
    email,
    user: response.body.user as { id: string; name: string; email: string },
  };
};

const createProjectWorkspace = async (agent: request.Agent) => {
  const organizationResponse = await agent
    .post("/api/organizations")
    .send({ name: `Org ${unique("test")}` })
    .expect(201);

  const organization = organizationResponse.body.organization;
  const projectKey = `T${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

  const projectResponse = await agent
    .post(`/api/organizations/${organization._id}/projects`)
    .send({
      name: "Backend Test Project",
      key: projectKey,
      description: "Project created by backend API tests",
    })
    .expect(201);

  const project = projectResponse.body.project;

  const sectionsResponse = await agent
    .get(`/api/projects/${project._id}/sections`)
    .expect(200);

  return {
    organization,
    project,
    section: sectionsResponse.body.sections[0],
    sections: sectionsResponse.body.sections,
  };
};

const createTask = async (agent: request.Agent, sectionId: string) => {
  const taskResponse = await agent
    .post(`/api/sections/${sectionId}/tasks`)
    .send({
      title: "Create API test task",
      description: "A focused task created through Supertest",
      priority: "medium",
      type: "task",
      labels: ["backend", "test"],
    })
    .expect(201);

  return taskResponse.body.task;
};

const addProjectMember = async (
  agent: request.Agent,
  projectId: string,
  userId: string,
  role: "ADMIN" | "DEVELOPER" | "QA" | "CLIENT"
) => {
  await agent
    .post(`/api/projects/${projectId}/members`)
    .send({ userId, role })
    .expect(200);
};

describe("backend API", () => {
  it("registers and logs in a user", async () => {
    const email = `${unique("auth")}@example.com`;

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Auth User",
        email,
        password,
      })
      .expect(201);

    expect(registerResponse.body.user.email).toBe(email);
    expect(registerResponse.headers["set-cookie"]?.join("; ")).toContain("accessToken=");

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email, password })
      .expect(200);

    expect(loginResponse.body.user.email).toBe(email);
    expect(loginResponse.headers["set-cookie"]?.join("; ")).toContain("refreshToken=");
  });

  it("returns 401 for protected routes without a token", async () => {
    const response = await request(app).get("/api/organizations").expect(401);

    expect(response.body.message).toBe("Authentication token missing");
  });

  it("creates a project with default board sections", async () => {
    const { agent } = await registerUser("Project Admin");
    const { project, sections } = await createProjectWorkspace(agent);

    expect(project.name).toBe("Backend Test Project");
    expect(project.key).toMatch(/^T[A-Z0-9]+$/);
    expect(sections.map((section: { name: string }) => section.name)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("creates a task inside a project section", async () => {
    const { agent } = await registerUser("Task Admin");
    const { section } = await createProjectWorkspace(agent);

    const task = await createTask(agent, section._id);

    expect(task.title).toBe("Create API test task");
    expect(task.section).toBe(section._id);
    expect(task.labels).toEqual(["backend", "test"]);
  });

  it("does not allow a client to access task time logs", async () => {
    const { agent: adminAgent } = await registerUser("Time Admin");
    const { project, section } = await createProjectWorkspace(adminAgent);
    const task = await createTask(adminAgent, section._id);
    const client = await registerUser("Client User");

    await addProjectMember(adminAgent, project._id, client.user.id, "CLIENT");

    await client.agent.get(`/api/tasks/${task._id}/time-logs`).expect(403);
  });

  it("does not allow a non-admin to assign a task to another user", async () => {
    const { agent: adminAgent } = await registerUser("Assign Admin");
    const { project, section } = await createProjectWorkspace(adminAgent);
    const developer = await registerUser("Developer One");
    const otherDeveloper = await registerUser("Developer Two");

    await addProjectMember(adminAgent, project._id, developer.user.id, "DEVELOPER");
    await addProjectMember(adminAgent, project._id, otherDeveloper.user.id, "DEVELOPER");

    const response = await developer.agent
      .post(`/api/sections/${section._id}/tasks`)
      .send({
        title: "Assign another developer",
        assignee: otherDeveloper.user.id,
      })
      .expect(403);

    expect(response.body.message).toBe("Only project admins can assign tasks to others");
  });
});
