const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('  Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`✗ MongoDB connection error: ${error.message}`);
    console.error('  Tip: Make sure your IP is whitelisted in MongoDB Atlas → Network Access');
    process.exit(1);
  }
};

module.exports = connectDB;
