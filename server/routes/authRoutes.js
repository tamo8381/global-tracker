const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  userPhotoUpload,
  changePassword
} = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Limit login attempts to mitigate brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.'
});

// Limit change-password attempts (per IP) to reduce abuse
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many password change attempts from this IP, please try again later.'
});

// Limit uploads (per IP) to avoid abuse
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many uploads from this IP, please try again later.'
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.route('/:id/photo').put(protect, uploadLimiter, userPhotoUpload);
// Handle both GET and POST for logout
router.route('/logout')
  .get(protect, logout)
  .post(protect, logout);
router.post('/change-password', protect, changePasswordLimiter, [
  check('currentPassword', 'Current password is required').not().isEmpty(),
  check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 })
], changePassword);

module.exports = router;
