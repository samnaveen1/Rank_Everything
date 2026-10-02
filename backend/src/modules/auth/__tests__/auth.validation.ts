import assert from "node:assert/strict";
import { AuthError, loginAccount, registerAccount } from "../service.js";
import * as mongodb from "../../../db/mongodb.js";

const mockDb = () => {
  const usersByEmail = new Map<string, any>();
  const usersByHandle = new Map<string, any>();
  const collection = {
    findOne: async (query: any) => {
      if (query?.handle) return usersByHandle.get(query.handle) || null;
      if (query?.email) return usersByEmail.get(query.email) || null;
      if (query?.$or) {
        for (const cond of query.$or) {
          if (cond.handle) {
            const u = usersByHandle.get(cond.handle);
            if (u) return u;
          }
          if (cond.email) {
            const u = usersByEmail.get(cond.email);
            if (u) return u;
          }
        }
      }
      return null;
    },
    insertOne: async (doc: any) => {
      usersByEmail.set(doc.email, doc);
      usersByHandle.set(doc.handle, doc);
      return { insertedId: "1" };
    },
    deleteMany: async () => ({ deletedCount: 0 }),
    deleteOne: async () => ({ deletedCount: 0 }),
  };
  return { collection: () => collection } as any;
};

(mongodb as any).getDatabase = async () => mockDb();
(mongodb as any).closeDatabase = async () => {};

const run = async () => {
  try {
    await registerAccount({ name: "T", email: "t@e.com", handle: "test", password: "password123" });
  } catch (e) {
    assert.fail("valid reg failed");
  }
  try {
    await registerAccount({ name: "T", email: "bad", handle: "bad1", password: "password123" });
    assert.fail();
  } catch (e) { assert.ok(e instanceof AuthError && e.status === 400); }
  try {
    await registerAccount({ name: "T", email: "b2@e.com", handle: "ab", password: "password123" });
    assert.fail();
  } catch (e) { assert.ok(e instanceof AuthError && e.status === 400); }
  try {
    await registerAccount({ name: "T", email: "b3@e.com", handle: "good", password: "short" });
    assert.fail();
  } catch (e) { assert.ok(e instanceof AuthError && e.status === 400); }
  try {
    await loginAccount({ identifier: "none@x.com", password: "x" });
    assert.fail();
  } catch (e) { assert.ok(e instanceof AuthError && e.status === 401); }
  console.log("ok");
};

run();
