const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    cardCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, unique: true, trim: true },
    nameTH: { type: String, trim: true },
    cardType: {
      type: String,
      required: true,
      enum: ["Monster", "Spell", "Trap"],
    },
    rarity: {
      type: String,
      required: true,
      enum: ["Normal", "Rare", "Super Rare", "Ultra Rare", "Secret Rare"],
    },
    attribute: {
      type: String,
      enum: ["LIGHT", "DARK", "EARTH", "WATER", "FIRE", "WIND", "DIVINE", null],
      default: null,
    },
    level: { type: Number, min: 0, max: 12, default: 0 },
    atk: { type: Number, min: 0, default: 0 },
    def: { type: Number, min: 0, default: 0 },
    description: { type: String, default: "" },
    effectTH: { type: String, default: "", trim: true, maxlength: 1000 },
    imageUrl: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    condition: {
      type: String,
      enum: ["Mint", "Near Mint", "Excellent", "Played"],
      default: "Near Mint",
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cardSchema.index({ cardType: 1, rarity: 1, price: 1 });

module.exports = mongoose.model("Card", cardSchema);
