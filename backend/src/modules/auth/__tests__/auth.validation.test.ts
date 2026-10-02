import assert from "node:assert/strict";
import { AuthError, loginAccount, registerAccount } from "../service.js";

const originalFetch = global.fetch;

const mockDb = () => {
  const users = new Map<string, any>();
  const usersByEmail = new Map<string, any>();
  const usersByHandle = new Map<string, any>();
  
  const collection = {
    findOne: async (query: any) => {
      if (query.handle) return usersByHandle.get(query.handle) || null;
      if (query.email) return usersByEmail.get(query.email) || null;
      if (query.$or) {
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
      users.set(doc.handle, doc);
      if (doc.email) usersByEmail.set(doc.email, doc);
      usersByHandle.set(doc.handle, doc);
      return { insertedId: "1" };
    },
    deleteMany: async () => ({ deletedCount: 0 }),
    deleteOne: async () => ({ deletedCount: 0 }),
    findOneAndUpdate: async () => null,
  };
  
  return {
    collection: () => collection,
    db: { collection: () => collection },
  };
};

global.fetch = originalFetch as any;

// Mock getDatabase
import * as mongodb from "../../../db/mongodb.js";

const mockGetDb = async () => mockDb() as any;

(mongodb as any).getDatabase = mockGetDb;
(mongodb as any).closeDatabase = async () => {};

async function testRegisterValid() {
  try {
    await registerAccount({
      name: "Test User",
      email: "test@example.com",
      handle: "testuser",
      password: "password123",
    });
  } catch (e) {
    assert.fail("Should not throw");
  }
}

async function testRegisterShortPassword() {
  try {
    await registerAccount({
      name: "Test",
      email: "test2@example.com",
      handle: "test2",
      password: "short",
    });
    assert.fail("Should throw");
  } catch (e) {
    assert.ok(e instanceof AuthError);
    assert.equal(e.status, 400);
  }
}

async function testRegisterInvalidEmail() {
  try {
    await registerAccount({
      name: "Test",
      email: "not-an-email",
      handle: "test3",
      password: "password123",
    });
    assert.fail("Should throw");
  } catch (e) {
    assert.ok(e instanceof AuthError);
    assert.equal(e.status, 400);
  }
}

async function testRegisterInvalidHandle() {
  try {
    await registerAccount({
      name: "Test",
      email: "test4@example.com",
      handle: "ab",
      password: "password123",
    });
    assert.fail("Should throw");
  } catch (e) {
    assert.ok(e instanceof AuthError);
    assert.equal(e.status, 400);
  }
}

async function testLoginInvalid() {
  try {
    await loginAccount({
      identifier: "nope@example.com",
      password: "wrong",
    });
    assert.fail("Should throw");
  } catch (e) {
    assert.ok(e instanceof AuthError);
    assert.equal(e.status, 401);
  }
}

await testRegisterValid();
await testRegisterShortPassword();
await testRegisterInvalidEmail();
await testRegisterInvalidHandle();
await testLoginInvalid();
console.log("All auth validation tests passed");
