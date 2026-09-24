const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../controllers/upload.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", protect, requireRole("admin"), upload.single("file"), uploadFile);

module.exports = router;