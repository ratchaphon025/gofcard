const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};
module.exports = connectDB;