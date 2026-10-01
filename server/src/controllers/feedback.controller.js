const Feedback = require("../models/feedback.model");

const getPublicFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ type: "review", status: "approved" })
      .select("name subject message rating createdAt")
      .sort({ createdAt: -1 })
      .limit(12);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const type = req.body.type;
    const name = String(req.body.name || "ลูกค้า").trim().slice(0, 80) || "ลูกค้า";
    const email = String(req.body.email || "").trim().toLowerCase();
    const subject = String(req.body.subject || "").trim().slice(0, 120);
    const message = String(req.body.message || "").trim();
    const rating = Number(req.body.rating);

    if (!["review", "bug"].includes(type)) {
      return res.status(400).json({ message: "เลือกประเภทความคิดเห็นหรือแจ้งบั๊ก" });
    }
    if (message.length < 10 || message.length > 1500) {
      return res.status(400).json({ message: "ข้อความต้องมีความยาว 10–1,500 ตัวอักษร" });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }
    if (type === "review" && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "ให้คะแนนตั้งแต่ 1 ถึง 5 ดาว" });
    }

    const feedback = await Feedback.create({
      type,
      name,
      email: email || undefined,
      subject: subject || undefined,
      message,
      ...(type === "review" ? { rating } : {}),
    });
    res.status(201).json({ message: "ส่งข้อมูลแล้ว รอแอดมินตรวจสอบ", feedbackId: feedback._id });
  } catch (error) {
    next(error);
  }
};

const getAdminFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ status: 1, createdAt: -1 }).limit(300);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

const reviewFeedback = async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "สถานะต้องเป็น approved หรือ rejected" });
    }
    const feedback = await Feedback.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      {
        $set: {
          status,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          adminNote: String(adminNote).trim().slice(0, 300),
        },
      },
      { new: true, runValidators: true }
    );
    if (!feedback) return res.status(409).json({ message: "รายการนี้ถูกตรวจสอบแล้วหรือไม่พบรายการ" });
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicFeedback, createFeedback, getAdminFeedback, reviewFeedback };
