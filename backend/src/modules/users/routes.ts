import { FastifyInstance } from "fastify";
import { requireAuth } from "../auth/service.js";
import {
    UserRankingGroup,
    currentUserHandleFor,
    findUser,
    isFollowing,
    listRankingsForUser,
    setFollowing,
    summarizeUser,
    updateUserProfile,
} from "./repository.js";
import { fallbackUser, toUserProfile } from "./types.js";

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asImageUrl = (value: unknown): string => {
  const url = asString(value);
  if (!url) return "";
  if (url.length > 2048 || !/^(https?:\/\/|file:\/\/|content:\/\/)/i.test(url)) {
    throw new Error("Image URL is invalid.");
  }
  return url;
};

const asUserRankingGroup = (value: string): UserRankingGroup =>
  value === "recent" || value === "category" ? value : "top";

/** Resolves the literal path segment "me" to the request's current user. */
const resolveHandle = (value: string, me: string): string =>
  value === "me" ? me : decodeURIComponent(value);

export const registerUserRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/api/users/me", async (request) => {
    const handle = await currentUserHandleFor(request);
    const user = (await findUser(handle)) ?? fallbackUser(handle);
    return toUserProfile(user, true);
  });

  app.patch<{ Body: unknown }>("/api/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const name = asString(body.name);
      const bio = asString(body.bio);
      const themePreference = body.themePreference === "dark" ? "dark" : body.themePreference === "light" ? "light" : undefined;

      if (name.length < 2 || name.length > 80) {
        return reply.code(400).send({ message: "Display name must be 2-80 characters." });
      }
      if (bio.length > 280) {
        return reply.code(400).send({ message: "Bio must be 280 characters or fewer." });
      }

      const handle = await currentUserHandleFor(request);
      const user = await updateUserProfile(handle, {
        name,
        bio,
        avatarUrl: asImageUrl(body.avatarUrl),
        backgroundImageUrl: asImageUrl(body.backgroundImageUrl),
        ...(themePreference ? { themePreference } : {}),
      });

      return user ? toUserProfile(user, true) : reply.code(404).send({ message: "User not found." });
    } catch (error) {
      return reply.code(400).send({ message: (error as Error).message });
    }
  });

  app.get<{ Params: { handle: string } }>("/api/users/:handle", async (request) => {
    const me = await currentUserHandleFor(request);
    const handle = resolveHandle(request.params.handle, me);
    const user = (await findUser(handle)) ?? fallbackUser(handle);
    return toUserProfile(user, handle === me);
  });

  app.get<{ Params: { handle: string }; Querystring: Record<string, unknown> }>(
    "/api/users/:handle/stats",
    async (request) => {
      const me = await currentUserHandleFor(request);
      const handle = resolveHandle(request.params.handle, me);
      const user = (await findUser(handle)) ?? fallbackUser(handle);
      const rankings = await listRankingsForUser(handle);
      return summarizeUser(user, rankings);
    },
  );

  app.get<{ Params: { handle: string }; Querystring: Record<string, unknown> }>(
    "/api/users/:handle/rankings",
    async (request) => {
      const me = await currentUserHandleFor(request);
      const handle = resolveHandle(request.params.handle, me);
      const group = asString(request.query.group) || "top";
      const category = asString(request.query.category);
      return listRankingsForUser(handle, asUserRankingGroup(group), category || undefined);
    },
  );

  app.get<{ Params: { handle: string } }>("/api/users/:handle/following", async (request) => {
    const me = await currentUserHandleFor(request);
    const handle = resolveHandle(request.params.handle, me);
    return { following: await isFollowing(handle, me) };
  });

  app.post<{ Params: { handle: string }; Body: unknown }>(
    "/api/users/:handle/follow",
    { preHandler: requireAuth },
    async (request, reply) => {
      const me = await currentUserHandleFor(request);
      const handle = resolveHandle(request.params.handle, me);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const follow = body.follow !== false;

      if (!(await findUser(handle))) {
        return reply.code(404).send({ message: "User not found." });
      }

      return setFollowing(handle, me, follow);
    },
  );
};
