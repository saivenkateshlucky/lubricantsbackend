import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { config } from "./config";
import { apiRouter } from "./routes";
import { notFoundHandler, errorHandler } from "./middleware";

const app = express();

// ── Security & parsing ──────────────────────
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ─────────────────────────────────
if (config.nodeEnv !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ── Routes ──────────────────────────────────
app.use("/api", apiRouter);

// ── Error handling ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
