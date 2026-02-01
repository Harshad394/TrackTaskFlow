import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js"
import usersRoute from "./routes/user.route.js"

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

export default app;