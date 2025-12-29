require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

// Import routes
const authRoutes = require('./routes/authRoutes');
const countryRoutes = require('./routes/countryRoutes');
const companyRoutes = require('./routes/companyRoutes');
const personRoutes = require('./routes/personRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');

// Import middleware
const errorHandler = require('./middleware/error');

const app = express();

// Security headers
app.use(helmet());

// Middleware
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL injection by sanitizing request data
app.use(xssClean()); // Prevent XSS attacks by sanitizing input
app.use(hpp()); // Protect against HTTP parameter pollution
app.use(cookieParser());
// Configure express-fileupload to create parent directories if they don't exist
app.use(fileUpload({ createParentPath: true }));

// Ensure upload path env defaults
process.env.FILE_UPLOAD_PATH = process.env.FILE_UPLOAD_PATH || path.join(__dirname, 'public', 'uploads');
process.env.MAX_FILE_UPLOAD = process.env.MAX_FILE_UPLOAD || 2 * 1024 * 1024; // 2MB default

// Ensure the uploads directory exists
const fs = require('fs');
try {
  if (!fs.existsSync(process.env.FILE_UPLOAD_PATH)) {
    fs.mkdirSync(process.env.FILE_UPLOAD_PATH, { recursive: true });
    console.log('Created upload directory at', process.env.FILE_UPLOAD_PATH);
  }
} catch (err) {
  console.error('Failed to ensure upload directory exists:', err);
}

// Enable CORS with specific origin
const corsOptions = {
  origin: ['http://172.20.110.202:3000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Handle preflight requests
app.options('*', cors(corsOptions));

// Serve uploads with a permissive Cross-Origin-Resource-Policy header so the browser can load images
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'public', 'uploads')));

// Serve other static files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global_tracking';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Connection string used:', MONGODB_URI);
});

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/countries', countryRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/people', personRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/users', userRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Global Tracker API is running...');
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
