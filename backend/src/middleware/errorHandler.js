import { isProduction } from "../config/index.js";
import { AppError } from "../errors/index.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    code = "MALFORMED_JSON";
    message = "Request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large";
  } else {
    console.error(err);
    if (!isProduction()) message = err.message;
  }
  res.status(status).json({ success: false, error: { code, message, ...(details && { details }) } });
}
