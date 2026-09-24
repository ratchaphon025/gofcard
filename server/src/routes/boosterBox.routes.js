const express = require("express");
const { getBoosterBoxes } = require("../controllers/boosterBox.controller");

const router = express.Router();
router.get("/", getBoosterBoxes);

module.exports = router;
