require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Guard: prevent accidental execution in production unless explicitly allowed
if (process.env.NODE_ENV === 'production' && process.env.DEV_UTILS_ALLOWED !== 'true') {
  console.error('Developer utility scripts are disabled in production. Set DEV_UTILS_ALLOWED=true to enable.');
  process.exit(1);
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/global_tracking';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // check if admin already exists
    const exists = await User.findOne({ email: 'admin@example.com' });
    if (exists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // 🔐 HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword, 
      role: 'admin'
    });

    await admin.save();

    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
