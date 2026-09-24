const Card = require("../models/card.model");
const BoosterBox = require("../models/boosterBox.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const { calculateOrderTotals } = require("../utils/order.utils");

const createOrder = async (req, res, next) => {
  const decremented = [];
  try {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || !items.length || !shippingAddress) {
      return res.status(400).json({ message: "Items and shipping address are required" });
    }
    const orderItems = [];
    for (const requested of items) {
      if ((!requested.card && !requested.boosterBox) || (requested.card && requested.boosterBox) || !Number.isInteger(requested.quantity) || requested.quantity < 1) {
        return res.status(400).json({ message: "Invalid order item" });
      }
      const isBox = Boolean(requested.boosterBox);
      const Product = isBox ? BoosterBox : Card;
      const product = await Product.findOneAndUpdate(
        { _id: isBox ? requested.boosterBox : requested.card, isActive: true, stock: { $gte: requested.quantity } },
        { $inc: { stock: -requested.quantity } },
        { new: true }
      );
      if (!product) return res.status(409).json({ message: "An item is unavailable or has insufficient stock" });
      decremented.push({ Product, id: product._id, quantity: requested.quantity });
      orderItems.push({
        ...(isBox ? { boosterBox: product._id } : { card: product._id }),
        cardCode: isBox ? product.boxCode : product.cardCode,
        name: product.name,
        rarity: isBox ? "Booster Box" : product.rarity,
        price: product.price,
        quantity: requested.quantity,
      });
    }

    const totals = calculateOrderTotals(orderItems);
    const order = await Order.create({
      orderNumber: `DD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      ...totals,
    });
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(201).json(order);
  } catch (error) {
    await Promise.all(decremented.map(({ Product, id, quantity }) => Product.findByIdAndUpdate(id, { $inc: { stock: quantity } })));
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders };
