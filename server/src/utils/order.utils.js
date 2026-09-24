const SHIPPING_FEE = 40;

const calculateOrderTotals = (items, shippingFee = SHIPPING_FEE) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    subtotal,
    shippingFee: subtotal > 0 ? shippingFee : 0,
    total: subtotal + (subtotal > 0 ? shippingFee : 0),
  };
};

module.exports = { SHIPPING_FEE, calculateOrderTotals };
