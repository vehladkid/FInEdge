import { unauthorized } from "../errors/index.js";
import { verifyToken } from "../services/authService.js";

// Expects "Authorization: Bearer <jwt>"; sets req.userId.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(unauthorized());
  try {
    req.userId = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
