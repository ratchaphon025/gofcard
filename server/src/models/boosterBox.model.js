const mongoose = require("mongoose");

const boosterBoxSchema = new mongoose.Schema({
  boxCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, unique: true, trim: true },
  releaseYear: { type: Number, required: true, min: 1999 },
  packsPerBox: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: "" },
  description: { type: String, default: "", trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("BoosterBox", boosterBoxSchema);
