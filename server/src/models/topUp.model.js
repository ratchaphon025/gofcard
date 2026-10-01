const mongoose = require("mongoose");

const topUpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 50, max: 50000 },
    method: { type: String, enum: ["bank_transfer", "promptpay"], required: true },
    transactionReference: { type: String, required: true, trim: true, uppercase: true, maxlength: 100, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

topUpSchema.index({ user: 1, createdAt: -1 });
topUpSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("TopUp", topUpSchema);
