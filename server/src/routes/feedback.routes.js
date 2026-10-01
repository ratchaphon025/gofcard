const express = require("express");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const {
  getPublicFeedback,
  createFeedback,
  getAdminFeedback,
  reviewFeedback,
} = require("../controllers/feedback.controller");

const router = express.Router();

router.get("/", getPublicFeedback);
router.post("/", createFeedback);
router.get("/admin", protect, requireRole("admin"), getAdminFeedback);
router.patch("/:id/review", protect, requireRole("admin"), reviewFeedback);

module.exports = router;
