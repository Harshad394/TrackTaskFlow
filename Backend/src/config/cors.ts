import { CorsOptions } from "cors";

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const configuredOrigins = process.env.FRONTEND_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins?.length ? configuredOrigins : defaultDevOrigins;

const isLanDevOrigin = (origin: string) => {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)[\d.]+:\d+$/.test(
    origin
  );
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isLanDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
