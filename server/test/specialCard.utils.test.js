const test = require("node:test");
const assert = require("node:assert/strict");
const { getMatchingBoxPrints, getMonsterType } = require("../src/utils/specialCard.utils");

test("classifies the requested extra deck summon types", () => {
  assert.equal(getMonsterType("Fusion Effect Monster"), "Fusion");
  assert.equal(getMonsterType("XYZ Pendulum Effect Monster"), "Xyz");
  assert.equal(getMonsterType("Synchro Tuner Monster"), "Synchro");
  assert.equal(getMonsterType("Pendulum Normal Monster"), "Pendulum");
  assert.equal(getMonsterType("Effect Monster"), null);
});

test("matches priced card prints to active booster box codes only", () => {
  const prints = getMatchingBoxPrints([
    { set_code: "LOB-EN001", set_price: "1.25" },
    { set_code: "MRD-EN002", set_price: "0" },
    { set_code: "UNLISTED-EN003", set_price: "8.00" },
  ], ["LOB-BOX", "MRD-BOX"]);

  assert.deepEqual(prints.map(({ boxCode }) => boxCode), ["LOB-BOX"]);
});

test("falls back to the card market price when an individual print is unpriced", () => {
  const [print] = getMatchingBoxPrints(
    [{ set_code: "AGOV-EN001", set_price: "0" }],
    ["AGOV-BOX"],
    2.5
  );

  assert.equal(print.usdPrice, 2.5);
  assert.equal(print.hasSetPrice, false);
});
