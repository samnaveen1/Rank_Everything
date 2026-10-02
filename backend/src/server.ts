import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { ensureIndexes } from "./db/indexes.js";
import { closeDatabase } from "./db/mongodb.js";
import { registerAiRoutes } from "./modules/ai/routes.js";
import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerCommunityRoutes } from "./modules/community/routes.js";
import { registerRankingRoutes } from "./modules/rankings/routes.js";
import { registerUserRoutes } from "./modules/users/routes.js";

const app = Fastify({ logger: true });

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

await app.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: "1 minute",
});

await app.register(cors, {
  origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
});

app.get("/health", async () => ({ status: "ok" }));
app.get("/api/health", async () => ({ status: "ok" }));

await registerAuthRoutes(app);
await registerRankingRoutes(app);
await registerUserRoutes(app);
await registerCommunityRoutes(app);
await registerAiRoutes(app);

const shutdown = async () => {
  await app.close();
  await closeDatabase();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await ensureIndexes();
  await app.listen({ host: "0.0.0.0", port: env.port });
} catch (error) {
  app.log.error(error);
  await closeDatabase();
  process.exit(1);
}
