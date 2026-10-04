FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

# Migrations are idempotent; they wait for PostgreSQL to accept connections.
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
