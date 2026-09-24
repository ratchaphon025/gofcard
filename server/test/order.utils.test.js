const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateOrderTotals } = require("../src/utils/order.utils");

test("calculates subtotal, shipping and total for an order", () => {
  assert.deepEqual(
    calculateOrderTotals([{ price: 120, quantity: 2 }, { price: 50, quantity: 1 }]),
    { subtotal: 290, shippingFee: 40, total: 330 }
  );
});

test("does not charge shipping for an empty order", () => {
  assert.deepEqual(calculateOrderTotals([]), { subtotal: 0, shippingFee: 0, total: 0 });
});
