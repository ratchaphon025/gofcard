const express = require("express");
const {
  getCards,
  getAdminCards,
  getCardById,
  createCard,
  updateCard,
} = require("../controllers/card.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(getCards).post(protect, requireRole("admin"), createCard);
router.get("/admin", protect, requireRole("admin"), getAdminCards);
router.route("/:id").get(getCardById).patch(protect, requireRole("admin"), updateCard);

module.exports = router;
