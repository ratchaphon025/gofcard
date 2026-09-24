const Cart = require("../models/cart.model");
const Card = require("../models/card.model");

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.card");
    res.json(cart || { user: req.user._id, items: [] });
  } catch (error) {
    next(error);
  }
};

const replaceCart = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const normalized = [];
    for (const item of items) {
      if (!item.card || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: "Each cart item needs a card and positive integer quantity" });
      }
      const card = await Card.findOne({ _id: item.card, isActive: true });
      if (!card) return res.status(404).json({ message: `Card not found: ${item.card}` });
      if (item.quantity > card.stock) return res.status(409).json({ message: `${card.name} has insufficient stock` });
      normalized.push({ card: card._id, quantity: item.quantity });
    }
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, items: normalized },
      { new: true, upsert: true, runValidators: true }
    ).populate("items.card");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, replaceCart };
