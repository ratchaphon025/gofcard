const test = require("node:test");
const assert = require("node:assert/strict");
const Card = require("../src/models/card.model");

test("requires the core fields for a TCG/OCG card", async () => {
  const error = await new Card().validate().catch((validationError) => validationError);
  assert.ok(error.errors.cardCode);
  assert.ok(error.errors.name);
  assert.ok(error.errors.cardType);
  assert.ok(error.errors.rarity);
  assert.ok(error.errors.price);
});

test("accepts a valid card listing", async () => {
  const card = new Card({
    cardCode: "OCG-001",
    name: "Blue-Eyes White Dragon",
    cardType: "Monster",
    rarity: "Ultra Rare",
    price: 450,
    stock: 2,
  });
  await card.validate();
});

test("supports box-pull-only extra deck cards", async () => {
  const card = new Card({
    cardCode: "BOX-SYN-001",
    name: "Box Pull Synchro",
    cardType: "Monster",
    monsterType: "Synchro",
    rarity: "Secret Rare",
    price: 120,
    stock: 0,
    isBoxPullOnly: true,
    boosterBoxCodes: ["DREV-BOX"],
  });

  await card.validate();
  assert.equal(card.isBoxPullOnly, true);
  assert.deepEqual(card.boosterBoxCodes, ["DREV-BOX"]);
});
