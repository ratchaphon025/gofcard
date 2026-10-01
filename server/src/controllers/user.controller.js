const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const WalletTransaction = require("../models/walletTransaction.model");

const createToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  walletBalance: user.walletBalance || 0,
  isActive: user.isActive,
  addresses: user.addresses,
  createdAt: user.createdAt,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, phone });
    res.status(201).json({ token: createToken(user._id), user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)) || !user.isActive) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: createToken(user._id), user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

const getMe = (req, res) => res.json({ user: userResponse(req.user) });

const updateMe = async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (addresses !== undefined) updates.addresses = addresses;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(userResponse));
  } catch (error) {
    next(error);
  }
};

const updateUserByAdmin = async (req, res, next) => {
  try {
    const { name, phone, role, isActive } = req.body;
    if (role !== undefined && !["customer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role" });
    }
    if (req.params.id === String(req.user._id) && role === "customer") {
      return res.status(400).json({ message: "An admin cannot remove their own admin role" });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: userResponse(user) });
  } catch (error) {
    next(error);
  }
};

const creditWalletByAdmin = async (req, res, next) => {
  const amount = Number(req.body.amount);
  const note = String(req.body.note || "").trim().slice(0, 200);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 50000) {
    return res.status(400).json({ message: "Amount must be a whole number between 1 and 50,000 baht" });
  }

  const session = await mongoose.startSession();
  try {
    let creditedUser;
    let transaction;
    await session.withTransaction(async () => {
      creditedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $inc: { walletBalance: amount } },
        { new: true, session }
      );
      if (!creditedUser) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
      }

      [transaction] = await WalletTransaction.create([{
        user: creditedUser._id,
        type: "admin_credit",
        amount,
        balanceAfter: creditedUser.walletBalance,
        performedBy: req.user._id,
        description: note || `Admin credit by ${req.user.email}`,
      }], { session });
    });

    res.status(201).json({
      user: { id: creditedUser._id, name: creditedUser.name, email: creditedUser.email, walletBalance: creditedUser.walletBalance },
      transaction,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = { register, login, getMe, updateMe, listUsers, updateUserByAdmin, creditWalletByAdmin };
