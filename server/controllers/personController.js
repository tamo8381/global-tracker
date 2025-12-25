const Person = require('../models/Person');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Escape user input used in regex to avoid ReDoS / NoSQL-style injections and limit length
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  const maxLen = 100; // limit length to prevent excessive processing
  const s = str.slice(0, maxLen);
  return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
};

// @desc    Get all people
// @route   GET /api/people
// @access  Public
exports.getPeople = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'lastName', 
            sortOrder = 'asc',
            search = '',
            company,
            country,
            isActive
        } = req.query;
        
        // Build query
        const query = {};
        
        // Search functionality (escape input to mitigate ReDoS/NoSQL injection)
        if (search) {
            const safeSearch = escapeRegex(search);
            if (safeSearch) {
              query.$or = [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { position: { $regex: safeSearch, $options: 'i' } },
                { department: { $regex: safeSearch, $options: 'i' } }
              ];
            }
        }
        
        // Filter by company
        if (company) {
            query.company = company;
        }
        
        // Filter by country
        if (country) {
            query.country = country;
        }
        
        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        // Execute query with pagination
        const people = await Person.find(query)
            .populate('company', 'name')
            .populate('country', 'name code capital')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v')
            .exec();
            
        // Get total count for pagination
        const count = await Person.countDocuments(query);
        
        res.json({
            success: true,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                pageSize: limit
            },
            data: people
        });
    } catch (error) {
        console.error('Error getting people:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get single person
// @route   GET /api/people/:id
// @access  Public
exports.getPerson = async (req, res) => {
    try {
        const person = await Person.findById(req.params.id)
            .populate('company', 'name industry website')
            .populate('country', 'name code capital');
            
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }

        res.json({
            success: true,
            data: person
        });
    } catch (error) {
        console.error('Error getting person:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Create person
// @route   POST /api/people
// @access  Private/Admin
exports.createPerson = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            position, 
            company, 
            country, 
            city,
            department, 
            notes,
            photo,
            bio 
        } = req.body;

        // Check if person with email already exists
        let person = await Person.findOne({ email });
        
        if (person) {
            return res.status(400).json({
                success: false,
                error: 'Person with this email already exists'
            });
        }

        // Check if company exists
        const companyExists = await Company.findById(company);
        if (!companyExists) {
            return res.status(400).json({
                success: false,
                error: 'Company not found'
            });
        }

        // Create new person
        person = new Person({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            position,
            company,
            country,
            city,
            department,
            notes,
            photo,
            bio,
            isActive: req.body.isActive === undefined ? true : (req.body.isActive === true || req.body.isActive === 'true')
        });

        await person.save();

        // Populate company and country data in the response (modern populate API)
        await person.populate([
            { path: 'company', select: 'name' },
            { path: 'country', select: 'name code capital' }
        ]);

        const populatedPerson = await Person.findById(person._id).populate([
            { path: 'company', select: 'name' },
            { path: 'country', select: 'name code capital' }
        ]);

        res.status(201).json({
            success: true,
            data: populatedPerson
        });
    } catch (error) {
        console.error('Error creating person:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Update person
// @route   PUT /api/people/:id
// @access  Private/Admin
exports.updatePerson = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        let person = await Person.findById(req.params.id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }

        // Check if another person exists with the same email
        if (req.body.email && req.body.email !== person.email) {
            const existingPerson = await Person.findOne({
                _id: { $ne: req.params.id },
                email: req.body.email.toLowerCase()
            });

            if (existingPerson) {
                return res.status(400).json({
                    success: false,
                    error: 'Another person with this email already exists'
                });
            }
        }

        // Update fields
        const updates = {};

        // Only update fields that are actually passed in the request
        const allowedUpdates = [
            'firstName', 'lastName', 'email', 'phone', 'position',
            'company', 'country', 'city', 'department', 'notes', 'lastActive', 'photo', 'bio', 'isActive'
        ];
        
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                // Convert email to lowercase when present
                if (update === 'email') {
                  updates[update] = req.body[update].toLowerCase();
                } else if (update === 'isActive') {
                  // Ensure boolean
                  updates[update] = req.body[update] === true || req.body[update] === 'true';
                  // Maintain lastActive timestamp when marking active
                  updates['lastActive'] = updates[update] ? new Date() : null;
                } else {
                  updates[update] = req.body[update];
                }
            }
        });
        
        // Apply updates
        person = await Person.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        )
        .populate('company', 'name')
        .populate('country', 'name code capital');

        res.json({
            success: true,
            data: person
        });
    } catch (error) {
        console.error('Error updating person:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Delete person
// @route   DELETE /api/people/:id
// @access  Private/Admin
exports.deletePerson = async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found',
                message: 'Person not found'
            });
        }

        // Remove person photo file if present
        if (person.photo) {
          try {
            const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');
            const photoPath = path.join(uploadDir, person.photo);
            if (fs.existsSync(photoPath)) {
              fs.unlinkSync(photoPath);
            }
          } catch (err) {
            console.warn('Failed to remove associated photo for deleted person:', err);
          }
        }

        await person.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting person:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get people by country
// @route   GET /api/people/country/:countryId
// @access  Public
exports.getPeopleByCountry = async (req, res) => {
    try {
        const people = await Person.find({ country: req.params.countryId })
            .populate('company', 'name')
            .sort('lastName firstName');

        res.json({
            success: true,
            count: people.length,
            data: people
        });
    } catch (error) {
        console.error('Error getting people by country:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get people by company
// @route   GET /api/people/company/:companyId
// @access  Public
exports.getPeopleByCompany = async (req, res) => {
    try {
        const people = await Person.find({ company: req.params.companyId })
            .populate('country', 'name code capital')
            .sort('lastName firstName');

        res.json({
            success: true,
            count: people.length,
            data: people
        });
    } catch (error) {
        console.error('Error getting people by company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    [TEMP] Delete person with no job title
// @route   DELETE /api/people/cleanup
// @access  Private
exports.deletePersonWithNoJobTitle = asyncHandler(async (req, res, next) => {
  try {
    const personToDelete = await Person.findOne({
      $or: [{ position: null }, { position: '' }],
    });

    if (personToDelete) {
      await Person.findByIdAndDelete(personToDelete._id);
      res.status(200).json({ success: true, message: `Deleted person: ${personToDelete.firstName} ${personToDelete.lastName}` });
    } else {
      res.status(404).json({ success: false, message: 'No person found with no job title.' });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Update person's active status
// @route   PATCH /api/people/:id/status
// @access  Private/Admin
exports.updatePersonStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        
        if (isActive === undefined) {
            return res.status(400).json({
                success: false,
                error: 'isActive field is required'
            });
        }
        
        const person = await Person.findByIdAndUpdate(
            req.params.id,
            { 
                isActive,
                lastActive: isActive ? new Date() : null
            },
            { new: true, runValidators: true }
        )
        .populate('company', 'name')
        .populate('country', 'name code capital');
        
        if (!person) {
            return res.status(404).json({
                success: false,
                error: 'Person not found'
            });
        }
        
        res.json({
            success: true,
            data: person
        });
    } catch (error) {
        console.error('Error updating person status:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Upload photo for person
// @route   PUT /api/people/:id/photo
// @access  Private/Admin
exports.personPhotoUpload = asyncHandler(async (req, res, next) => {
  const person = await Person.findById(req.params.id);

  if (!person) {
    return next(new ErrorResponse(`Person not found with id of ${req.params.id}`, 404));
  }

  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Basic checks
  const maxSize = Number(process.env.MAX_FILE_UPLOAD) || 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return next(new ErrorResponse(`Please upload an image less than ${maxSize} bytes`, 400));
  }

  // Use file-type to validate content
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
    detectedExt = file.mimetype.split('/')[1].split('+')[0]; // handles image/svg+xml
  } else if (file.name) {
    detectedExt = path.extname(file.name).replace('.', '').toLowerCase();
  }

  const allowedExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

  // Accept only images and supported extensions
  if ((detectedMime && !detectedMime.startsWith('image')) || !detectedExt || !allowedExts.includes(detectedExt)) {
    return next(new ErrorResponse(`Please upload a valid image file (allowed: ${allowedExts.join(', ')})`, 400));
  }

  // Construct safe filename using detected extension
  const fileName = `person_${person._id}.${detectedExt}`;
  const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');
  const targetPath = path.join(uploadDir, fileName);

  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Remove previous photo if it exists and is different
    if (person.photo && person.photo !== fileName) {
      const oldPath = path.join(uploadDir, person.photo);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (unlinkErr) {
          console.warn('Failed to remove old photo:', unlinkErr);
        }
      }
    }

    const mv = util.promisify(file.mv.bind(file));
    await mv(targetPath);

    // Update the person's photo and touch updatedAt so clients can pick up cache-bust
    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      { photo: fileName, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('company', 'name')
      .populate('country', 'name code capital');

    if (!updatedPerson) {
      return next(new ErrorResponse(`Person not found after file upload with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: updatedPerson });
  } catch (err) {
    console.error('File upload error:', err, 'targetPath:', targetPath);
    return next(new ErrorResponse(`Problem with file upload: ${err.message || 'unknown error'}`, 500));
  }
});
