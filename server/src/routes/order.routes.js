const express = require("express");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { createOrder, getMyOrders, getAllOrders } = require("../controllers/order.controller");

const router = express.Router();
router.get("/admin", protect, requireRole("admin"), getAllOrders);
router.route("/").get(protect, getMyOrders).post(protect, createOrder);
module.exports = router;
