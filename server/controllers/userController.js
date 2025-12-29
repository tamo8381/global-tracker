const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const Activity = require('../models/Activity');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ success: true, data: users });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  // Prevent creating duplicate accounts
  if (req.body.email) {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) {
      return next(new ErrorResponse('A user with that email already exists', 400));
    }
  }

  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  // If changing email, ensure it doesn't collide with another user
  if (req.body.email) {
    const other = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
    if (other) {
      return next(new ErrorResponse('Another user already uses that email', 400));
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user (transactional)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  let photoToDelete = null;

  // Helper to perform a non-transactional delete (fallback)
  const nonTransactionalDelete = async () => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Prevent removing the last admin account
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return next(new ErrorResponse('Cannot delete the last admin user', 400));
      }
    }

    if (user.photo && user.photo !== 'no-photo.jpg') {
      photoToDelete = user.photo;
    }

    // Delete related activities and the user (no transaction)
    await Activity.deleteMany({ user: user._id.toString() });
    await User.deleteOne({ _id: user._id });

    // Delete photo file if present
    if (photoToDelete) {
      const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');
      const photoPath = path.join(uploadDir, photoToDelete);
      try {
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      } catch (err) {
        console.error('Failed to delete user photo:', err.message || err);
      }
    }

    // Record deletion in Activity log (non-transactional path)
    try {
      const actor = req.user?.email || (req.user && req.user.id) || 'system';
      await Activity.create({
        type: 'user:delete',
        user: actor,
        details: `Deleted user: ${user.email} (${user._id})`,
        priority: 1,
        timestamp: Date.now()
      });
    } catch (actErr) {
      console.error('Failed to record user deletion activity (fallback):', actErr);
    }

    res.status(200).json({ success: true, data: {} });
  };

  try {
    // Try transaction first (preferred)
    await session.withTransaction(async () => {
      const user = await User.findById(req.params.id).session(session);
      if (!user) {
        throw new ErrorResponse(`User not found with id of ${req.params.id}`, 404);
      }

      // Prevent removing the last admin account
      if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' }).session(session);
        if (adminCount <= 1) {
          throw new ErrorResponse('Cannot delete the last admin user', 400);
        }
      }

      // Mark photo for deletion after transaction commits
      if (user.photo && user.photo !== 'no-photo.jpg') {
        photoToDelete = user.photo;
      }

      // Remove related activities that reference this user id
      await Activity.deleteMany({ user: user._id.toString() }).session(session);

      // Delete the user
      await User.deleteOne({ _id: user._id }).session(session);
    });

    // If we removed a custom photo, delete it from disk (outside transaction)
    if (photoToDelete) {
      const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');
      const photoPath = path.join(uploadDir, photoToDelete);
      try {
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      } catch (err) {
        // Log but don't fail the request because DB changes already committed
        console.error('Failed to delete user photo:', err.message || err);
      }
    }
    // Record deletion in Activity log
    try {
      const actor = req.user?.email || (req.user && req.user.id) || 'system';
      await Activity.create({
        type: 'user:delete',
        user: actor,
        details: `Deleted user: ${user.email} (${user._id})`,
        priority: 1,
        timestamp: Date.now()
      });
    } catch (actErr) {
      console.error('Failed to record user deletion activity:', actErr);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    // If transactions are not supported (e.g., standalone MongoDB), fall back to non-transactional delete
    const isTransactionNotSupported = err && (err.name === 'MongoServerError' && (err.code === 20 || err.codeName === 'IllegalOperation'));
    if (isTransactionNotSupported) {
      console.warn('Transactions not supported by MongoDB instance; using non-transactional delete fallback');
      await nonTransactionalDelete();
      // record activity in non-transactional path is handled inside nonTransactionalDelete
      return;
    }

    // Other errors: propagate
    throw err;
  } finally {
    session.endSession();
  }
});
