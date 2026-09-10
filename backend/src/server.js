import app from "./app.js";
import { config } from "./config/index.js";

// Process entry point — referenced by package.json "start" and the Dockerfile CMD.
app.listen(config.port, () => {
  console.log(`FinEdge API listening on port ${config.port}`);
});
