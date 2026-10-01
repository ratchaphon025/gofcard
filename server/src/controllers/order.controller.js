const Card = require("../models/card.model");
const BoosterBox = require("../models/boosterBox.model");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const WalletTransaction = require("../models/walletTransaction.model");
const { calculateOrderTotals } = require("../utils/order.utils");

const createOrder = async (req, res, next) => {
  const decremented = [];
  let walletDebit = null;
  let walletDebitAmount = 0;
  let createdOrder = null;
  let createdTransaction = null;
  try {
    const { items, shippingAddress } = req.body;
    const paymentMethod = req.body.paymentMethod || "cash_on_delivery";
    if (!Array.isArray(items) || !items.length || !shippingAddress) {
      return res.status(400).json({ message: "Items and shipping address are required" });
    }
    if (!["cash_on_delivery", "wallet"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    const hasInvalidItem = items.some((requested) =>
      (!requested.card && !requested.boosterBox) ||
      (requested.card && requested.boosterBox) ||
      !Number.isInteger(requested.quantity) ||
      requested.quantity < 1
    );
    if (hasInvalidItem) return res.status(400).json({ message: "Invalid order item" });

    const orderItems = [];
    for (const requested of items) {
      const isBox = Boolean(requested.boosterBox);
      const Product = isBox ? BoosterBox : Card;
      const product = await Product.findOneAndUpdate(
        { _id: isBox ? requested.boosterBox : requested.card, isActive: true, stock: { $gte: requested.quantity } },
        { $inc: { stock: -requested.quantity } },
        { new: true }
      );
      if (!product) {
        const error = new Error("An item is unavailable or has insufficient stock");
        error.status = 409;
        throw error;
      }
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
    let walletBalance;
    if (paymentMethod === "wallet") {
      walletDebit = await User.findOneAndUpdate(
        { _id: req.user._id, walletBalance: { $gte: totals.total } },
        { $inc: { walletBalance: -totals.total } },
        { new: true }
      );
      if (!walletDebit) {
        const error = new Error("Wallet balance is insufficient for this order");
        error.status = 409;
        throw error;
      }
      walletDebitAmount = totals.total;
      walletBalance = walletDebit.walletBalance;
    }

    createdOrder = await Order.create({
      orderNumber: `DD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      status: paymentMethod === "wallet" ? "paid" : "pending_payment",
      ...totals,
    });

    if (paymentMethod === "wallet") {
      [createdTransaction] = await WalletTransaction.create([{
        user: req.user._id,
        type: "purchase",
        amount: -totals.total,
        balanceAfter: walletBalance,
        order: createdOrder._id,
        description: `Order ${createdOrder.orderNumber}`,
      }]);
    }

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }).catch(() => {});
    res.status(201).json({ ...createdOrder.toObject(), walletBalance });
  } catch (error) {
    if (createdTransaction) await WalletTransaction.findByIdAndDelete(createdTransaction._id).catch(() => {});
    if (createdOrder) await Order.findByIdAndDelete(createdOrder._id).catch(() => {});
    if (walletDebitAmount) await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: walletDebitAmount } }).catch(() => {});
    await Promise.all(decremented.map(({ Product, id, quantity }) => Product.findByIdAndUpdate(id, { $inc: { stock: quantity } })));
    if (error.status) return res.status(error.status).json({ message: error.message });
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
