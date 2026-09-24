const test = require("node:test");
const assert = require("node:assert/strict");
const { requireRole } = require("../src/middlewares/auth.middleware");

test("allows an admin through the admin guard", () => {
  let called = false;
  requireRole("admin")({ user: { role: "admin" } }, { status: () => ({ json: () => {} }) }, () => { called = true; });
  assert.equal(called, true);
});

test("rejects a customer from the admin guard", () => {
  let called = false;
  let statusCode;
  const response = { status: (code) => { statusCode = code; return { json: () => {} }; } };
  requireRole("admin")({ user: { role: "customer" } }, response, () => { called = true; });
  assert.equal(called, false);
  assert.equal(statusCode, 403);
});
