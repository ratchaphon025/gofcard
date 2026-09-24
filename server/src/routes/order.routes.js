const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { createOrder, getMyOrders } = require("../controllers/order.controller");

const router = express.Router();
router.route("/").get(protect, getMyOrders).post(protect, createOrder);
module.exports = router;
