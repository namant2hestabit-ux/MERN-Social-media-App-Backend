const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV !== "test") {
      await mongoose.connect(process.env.MONGO_DB_URI);
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { connectDB };
