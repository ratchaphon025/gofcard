const express = require("express");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const {
  getTopUpConfig,
  createTopUp,
  getMyTopUps,
  getPendingTopUps,
  reviewTopUp,
} = require("../controllers/topUp.controller");

const router = express.Router();

router.get("/config", getTopUpConfig);
router.get("/me", protect, getMyTopUps);
router.post("/", protect, createTopUp);
router.get("/admin", protect, requireRole("admin"), getPendingTopUps);
router.patch("/:id/review", protect, requireRole("admin"), reviewTopUp);

module.exports = router;
