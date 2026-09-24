const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { getCart, replaceCart } = require("../controllers/cart.controller");

const router = express.Router();
router.route("/").get(protect, getCart).put(protect, replaceCart);
module.exports = router;
