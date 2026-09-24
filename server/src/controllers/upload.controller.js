const path = require("node:path");
const { put } = require("@vercel/blob");

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A file is required" });

    const safeName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(`uploads/${Date.now()}-${safeName}`, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
      addRandomSuffix: true,
    });

    res.status(201).json({ url: blob.url, pathname: blob.pathname });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile };