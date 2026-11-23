const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban';

  // Ensure Node.js DNS resolver can resolve MongoDB Atlas SRV records (_mongodb._tcp)
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // Ignore if environment disallows setting custom DNS servers
    }
  }

  if (uri.includes('<db_password>')) {
    console.error('\n' + '='.repeat(60));
    console.error('⚠️  MONGODB ATLAS CONFIGURATION NOTICE:');
    console.error('   Your MONGODB_URI contains the placeholder "<db_password>".');
    console.error('   Please replace "<db_password>" with your actual MongoDB Atlas password in server/.env.');
    console.error('='.repeat(60) + '\n');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🍃 MongoDB connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // In dev, don't crash the whole process so developer can edit .env
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
