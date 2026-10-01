const mongoose = require("mongoose");
const TopUp = require("../models/topUp.model");
const User = require("../models/user.model");
const WalletTransaction = require("../models/walletTransaction.model");

const getTopUpConfig = (req, res) => res.json({
  bankName: process.env.TOPUP_BANK_NAME || "",
  accountName: process.env.TOPUP_BANK_ACCOUNT_NAME || "",
  accountNumber: process.env.TOPUP_BANK_ACCOUNT_NUMBER || "",
  promptPayId: process.env.TOPUP_PROMPTPAY_ID || "",
});

const createTopUp = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const method = req.body.method;
    const transactionReference = String(req.body.transactionReference || "").trim().toUpperCase();
    if (!Number.isInteger(amount) || amount < 50 || amount > 50000) {
      return res.status(400).json({ message: "Top-up amount must be between 50 and 50,000 baht" });
    }
    if (!["bank_transfer", "promptpay"].includes(method)) {
      return res.status(400).json({ message: "Choose bank transfer or PromptPay" });
    }
    if (!transactionReference || transactionReference.length > 100) {
      return res.status(400).json({ message: "Enter the transfer reference from your payment slip" });
    }

    const topUp = await TopUp.create({ user: req.user._id, amount, method, transactionReference });
    res.status(201).json({ topUp });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This transfer reference has already been submitted" });
    }
    next(error);
  }
};

const getMyTopUps = async (req, res, next) => {
  try {
    const [items, transactions] = await Promise.all([
      TopUp.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
      WalletTransaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50),
    ]);
    res.json({ walletBalance: req.user.walletBalance || 0, topUps: items, transactions });
  } catch (error) {
    next(error);
  }
};

const getPendingTopUps = async (req, res, next) => {
  try {
    const topUps = await TopUp.find().populate("user", "name email").sort({ createdAt: -1 }).limit(200);
    res.json(topUps);
  } catch (error) {
    next(error);
  }
};

const reviewTopUp = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { decision, note = "" } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }
    let reviewedTopUp;
    let balance;
    await session.withTransaction(async () => {
      reviewedTopUp = await TopUp.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { $set: { status: decision, reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote: String(note).trim().slice(0, 300) } },
        { new: true, session }
      );
      if (!reviewedTopUp) {
        const error = new Error("Top-up request was already reviewed or not found");
        error.status = 409;
        throw error;
      }

      if (decision === "approved") {
        const creditedUser = await User.findByIdAndUpdate(
          reviewedTopUp.user,
          { $inc: { walletBalance: reviewedTopUp.amount } },
          { new: true, session }
        );
        if (!creditedUser) throw new Error("Top-up user was not found");
        balance = creditedUser.walletBalance;
        await WalletTransaction.create([{
          user: creditedUser._id,
          type: "topup",
          amount: reviewedTopUp.amount,
          balanceAfter: balance,
          topUp: reviewedTopUp._id,
          description: `Wallet top-up ${reviewedTopUp._id}`,
        }], { session });
      }
    });

    res.json({ topUp: reviewedTopUp, walletBalance: balance });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = { getTopUpConfig, createTopUp, getMyTopUps, getPendingTopUps, reviewTopUp };
