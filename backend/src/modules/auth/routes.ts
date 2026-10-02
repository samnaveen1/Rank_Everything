import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
    AuthError,
    authUserFromRequest,
    googleSignIn,
    loginAccount,
    registerAccount,
} from "./service.js";
import { bearerTokenFrom, clearSessionForToken } from "./session.js";

const ERROR_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
};

const sendError = (request: FastifyRequest, reply: FastifyReply, error: unknown) => {
  if (error instanceof AuthError) {
    return reply.code(error.status).send({
      message: error.message,
      error: {
        code: ERROR_CODES[error.status] ?? "AUTH_ERROR",
        message: error.message,
      },
    });
  }

  request.log.error(error);
  return reply.code(500).send({
    message: "Authentication failed.",
    error: {
      code: "INTERNAL_ERROR",
      message: "Authentication failed.",
    },
  });
};

export const registerAuthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post(
    "/api/auth/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
          ban: 5,
        },
      },
    },
    async (request, reply) => {
      try {
        return await registerAccount((request.body ?? {}) as Record<string, unknown>);
      } catch (error) {
        return sendError(request, reply, error);
      }
    },
  );

  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
          ban: 10,
        },
      },
    },
    async (request, reply) => {
      try {
        return await loginAccount((request.body ?? {}) as Record<string, unknown>);
      } catch (error) {
        return sendError(request, reply, error);
      }
    },
  );

  app.post(
    "/api/auth/google",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
          ban: 10,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (request.body ?? {}) as Record<string, unknown>;
        return await googleSignIn(body.accessToken);
      } catch (error) {
        return sendError(request, reply, error);
      }
    },
  );

  app.get("/api/auth/me", async (request, reply) => {
    const user = await authUserFromRequest(request);

    if (!user) {
      return reply.code(401).send({ message: "Sign in to continue." });
    }

    return user;
  });

  // Idempotent: logging out an already-expired session still succeeds.
  app.post("/api/auth/logout", async (request) => {
    await clearSessionForToken(bearerTokenFrom(request));
    return { ok: true };
  });
};
