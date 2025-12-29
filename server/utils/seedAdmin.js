const mongoose = require('mongoose');
const User = require('../models/User');
const colors = require('colors');

// Load env vars
require('dotenv').config({ path: __dirname + '/../../.env' });

// Connect to DB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/global_tracking';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createAdmin = async () => {
  // Guard: prevent accidental execution in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && process.env.DEV_UTILS_ALLOWED !== 'true') {
    console.error('Developer utility scripts are disabled in production. Set DEV_UTILS_ALLOWED=true to enable.');
    process.exit(1);
  }
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (adminExists) {
      console.log('Admin user already exists'.yellow);
      process.exit();
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully'.green);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit();
  } catch (err) {
    console.error('Error creating admin user:'.red, err);
    process.exit(1);
  }
};

createAdmin();
