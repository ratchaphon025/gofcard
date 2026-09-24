const express = require("express");
const cors = require("cors");
const trackRoutes = require("./routes/track.routes");
const cardRoutes = require("./routes/card.routes");
const userRoutes = require("./routes/user.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const boosterBoxRoutes = require("./routes/boosterBox.routes");
const uploadRoutes = require("./routes/upload.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const app = express();
const allowedOrigins = [
  ...(process.env.CLIENT_URL || "http://localhost:5173").split(","),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  "https://gofcard.vercel.app",
].map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
const isLocalDevelopmentOrigin = (origin) => /^http:\/\/localhost:\d+$/.test(origin || "");

// 1. Global middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && isLocalDevelopmentOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json());

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/tracks", trackRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/booster-boxes", boosterBoxRoutes);
app.use("/api/uploads", uploadRoutes);

// 3. Error handling — must be LAST
app.use(notFound);
app.use(errorHandler);

module.exports = app;
