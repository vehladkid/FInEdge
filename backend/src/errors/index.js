export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const validationError = (message, details) =>
  new AppError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", message);
export const notFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);
export const conflict = (message) => new AppError(409, "CONFLICT", message);
