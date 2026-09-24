const Card = require("../models/card.model");
const editableFields = [
  "cardCode", "name", "nameTH", "cardType", "rarity", "attribute", "level",
  "atk", "def", "description", "effectTH", "imageUrl", "price", "stock", "condition", "isFeatured", "isActive",
];

const pickCardFields = (body) => editableFields.reduce((result, field) => {
  if (body[field] !== undefined) result[field] = body[field];
  return result;
}, {});

const getCards = async (req, res, next) => {
  try {
    const { rarity, cardType, search } = req.query;
    const filter = { isActive: true };
    if (rarity) filter.rarity = rarity;
    if (cardType) filter.cardType = cardType;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { cardCode: { $regex: search, $options: "i" } },
    ];

    const cards = await Card.find(filter).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

const getAdminCards = async (req, res, next) => {
  try {
    const { rarity, cardType, search } = req.query;
    const filter = {};
    if (rarity) filter.rarity = rarity;
    if (cardType) filter.cardType = cardType;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { cardCode: { $regex: search, $options: "i" } },
    ];

    const cards = await Card.find(filter).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

const getCardById = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (error) {
    next(error);
  }
};

const createCard = async (req, res, next) => {
  try {
    const card = await Card.create(pickCardFields(req.body));
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, pickCardFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCards, getAdminCards, getCardById, createCard, updateCard };
