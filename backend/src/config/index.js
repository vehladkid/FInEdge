// Centralised environment access — no other module reads process.env directly.
const env = process.env;

export const config = {
  nodeEnv: env.NODE_ENV || "development",
  port: Number(env.PORT) || 5000,
  databaseUrl:
    env.DATABASE_URL || "postgresql://finedge:finedge@localhost:5433/finedge",
  jwtSecret: env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: env.JWT_EXPIRES_IN || "2h",
  bcryptRounds: Number(env.BCRYPT_ROUNDS) || 10,
  // Optional. Without a key the insights endpoint uses its rule-based engine.
  aiApiKey: env.AI_API_KEY || "",
  aiModel: env.AI_MODEL || "claude-haiku-4-5-20251001",
  corsOrigin: env.CORS_ORIGIN || "*",
};

export const isProduction = () => config.nodeEnv === "production";
