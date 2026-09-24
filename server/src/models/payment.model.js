const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    method: { type: String, enum: ["bank_transfer", "promptpay", "credit_card", "cash_on_delivery"], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "verified", "failed", "refunded"], default: "pending" },
    transactionId: { type: String, trim: true, sparse: true, unique: true },
    slipImageUrl: { type: String, trim: true },
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
