const path = require('path');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const fs = require('fs');
const util = require('util');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for email:', email);

  // Validate email & password
  if (!email || !password) {
    console.log('Missing email or password');
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Check for user
    console.log('Looking for user in database...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('No user found with email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    console.log('User found, checking password...');
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    console.log('Login successful for user:', user._id);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    return next(new ErrorResponse('Login error', 500));
  }
});

// @desc    Upload photo for user
// @route   PUT /api/v1/auth/:id/photo
// @access  Private
exports.userPhotoUpload = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Authorization: only the user themselves or an admin can upload a photo for this account
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to upload a photo for this user', 403));
  }

  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype || !file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Validate using both mimetype and content sniffing
  if (!file.mimetype || !file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Use file-type to detect the actual file content and extension
  let fileTypeResult = null;
  try {
    // Dynamic import because `file-type` is an ESM-only package
    const ft = await import('file-type');
    const fromBuf = ft.fileTypeFromBuffer || ft.fromBuffer;
    if (typeof fromBuf === 'function') {
      fileTypeResult = await fromBuf(file.data);
    }
  } catch (detErr) {
    console.warn('File type detection failed:', detErr);
  }

  // Determine detected extension/mime using file-type result, mimetype, or filename fallback
  let detectedExt = null;
  let detectedMime = null;

  if (fileTypeResult && fileTypeResult.mime) {
    detectedExt = fileTypeResult.ext;
    detectedMime = fileTypeResult.mime;
  } else if (file.mimetype && file.mimetype.startsWith('image/')) {
    detectedMime = file.mimetype;
    detectedExt = file.mimetype.split('/')[1].split('+')[0];
  } else if (file.name) {
    detectedExt = path.extname(file.name).replace('.', '').toLowerCase();
  }

  const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

  // Accept only images and supported extensions
  if ((detectedMime && !detectedMime.startsWith('image')) || !detectedExt || !allowedExts.includes(detectedExt)) {
    console.warn('Profile photo failed content-sniff detection', { name: file.name, mimetype: file.mimetype });
    return next(new ErrorResponse(`Please upload a valid image file (allowed: png, jpg, jpeg, gif, webp)`, 400));
  }

  // Coerce MAX_FILE_UPLOAD to number
  const maxSize = Number(process.env.MAX_FILE_UPLOAD) || 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${maxSize} bytes`,
        400
      )
    );
  }

  // Create custom filename based on detected extension (avoid using user-supplied filename)
  const chosenExt = (fileTypeResult && fileTypeResult.ext) ? fileTypeResult.ext : detectedExt;
  file.name = `photo_${user._id}.${chosenExt}`;

  const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');
  const targetPath = path.join(uploadDir, file.name);

  try {
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory at', uploadDir);
    }

    // Promisify mv to use await and proper try/catch
    const mv = util.promisify(file.mv.bind(file));
    await mv(targetPath);

    await User.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  } catch (err) {
    console.error('File upload error:', err, 'targetPath:', targetPath);
    return next(new ErrorResponse(`Problem with file upload: ${err.message || 'unknown error'}`, 500));
  }
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Change password for current user
// @route   POST /api/v1/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorResponse('Current password and new password (and confirmation) are required', 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorResponse('New password and confirmation do not match', 400));
  }

  if (String(newPassword).length < 8) {
    return next(new ErrorResponse('New password must be at least 8 characters', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // Recommend SameSite Lax to mitigate CSRF while allowing top-level GET-based flows
    sameSite: 'lax'
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
};
