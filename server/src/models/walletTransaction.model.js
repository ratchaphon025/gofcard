const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["topup", "purchase"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    topUp: { type: mongoose.Schema.Types.ObjectId, ref: "TopUp", unique: true, sparse: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", unique: true, sparse: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
