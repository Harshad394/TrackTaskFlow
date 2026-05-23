import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js"
import usersRoute from "./routes/user.route.js"
import taskRoute from "./routes/task.route.js"
import organizationRoute from "./routes/organization.route.js";
import projectRoute from "./routes/project.route.js";
import sectionRoute from "./routes/section.route.js";
import commentRoute from "./routes/comment.route.js";
import timeLogRoute from "./routes/timeLog.route.js";
import notificationRoute from "./routes/notification.route.js";

const app = express()

app.use(express.json())
app.use(cors(
    {
  origin: true,
  credentials: true,
}
))
app.use(cookieParser())

app.use("/api/auth",authRoute)
app.use("/api/users",usersRoute)
app.use("/api",organizationRoute)
app.use("/api",projectRoute)
app.use("/api",sectionRoute)
app.use("/api",taskRoute)
app.use("/api",commentRoute)
app.use("/api",timeLogRoute)
app.use("/api",notificationRoute)


export default app;
