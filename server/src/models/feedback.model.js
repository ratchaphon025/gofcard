const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["review", "bug"], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80, default: "ลูกค้า" },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    rating: { type: Number, min: 1, max: 5 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    adminNote: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

feedbackSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
