import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import healthRoutes from "./routes/health.js";
import apiRoutes from "./routes/api.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { aiInsights } from "./services/aiClient.js";

// Builds the Express application: middleware and route registration only.
// Starting the process is server.js's job, which keeps the app importable
// without opening a port. `ai` is injectable so tests never call a provider.
export function createApp({ ai = aiInsights } = {}) {
  const app = express();
  app.locals.ai = ai;
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/", healthRoutes);
  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export default createApp();
