// Centralised environment access — no other module reads process.env directly.
//
// Only PORT is exposed because only PORT is used. DATABASE_URL is injected by
// docker-compose but nothing reads it yet; it is deliberately not listed here so
// this file describes the configuration the app actually has.
export const config = {
  port: process.env.PORT || 5000,
};
