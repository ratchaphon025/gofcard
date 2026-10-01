const express = require("express");
const { register, login, getMe, updateMe, creditWalletByAdmin } = require("../controllers/user.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { listUsers, updateUserByAdmin } = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.route("/me").get(protect, getMe).patch(protect, updateMe);
router.get("/", protect, requireRole("admin"), listUsers);
router.patch("/:id", protect, requireRole("admin"), updateUserByAdmin);
router.post("/:id/wallet", protect, requireRole("admin"), creditWalletByAdmin);

module.exports = router;
