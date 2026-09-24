const test = require("node:test");
const assert = require("node:assert/strict");
const Card = require("../src/models/card.model");

test("card model ignores admin-only metadata when creating a card", () => {
  const card = new Card({
    cardCode: "TCG-ADMIN-001",
    name: "Admin Test Card",
    cardType: "Monster",
    rarity: "Rare",
    price: 100,
    stock: 5,
    role: "admin",
    passwordHash: "should-not-be-card-data",
  });
  assert.equal(card.get("role"), undefined);
  assert.equal(card.get("passwordHash"), undefined);
});
