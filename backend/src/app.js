import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";

// Builds the Express application: middleware and route registration only.
// Starting the process is server.js's job, which keeps the app importable
// without opening a port.
const app = express();

app.use(cors());
app.use("/", healthRoutes);

export default app;
