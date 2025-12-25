const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const personController = require('../controllers/personController');
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many uploads from this IP, please try again later.'
});

// Get all people
router.get('/', personController.getPeople);

// Get a single person by ID
router.get('/:id', personController.getPerson);

// Create a new person
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('company', 'Company ID is required').isMongoId(),
    check('country', 'Country ID is required').isMongoId()
  ],
  personController.createPerson
);

// Update a person
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    check('email', 'Please include a valid email').optional().isEmail(),
    check('company', 'Invalid company ID').optional().isMongoId(),
    check('country', 'Invalid country ID').optional().isMongoId()
  ],
  personController.updatePerson
);

// Upload person photo (admins only)
router.route('/:id/photo').put(protect, authorize('admin'), uploadLimiter, personController.personPhotoUpload);

// Delete a person
router.delete('/:id', protect, authorize('admin'), personController.deletePerson);

// Get people by country
router.get('/country/:countryId', personController.getPeopleByCountry);

// Get people by company
router.get('/company/:companyId', personController.getPeopleByCompany);

// Update person's active status
router.patch('/:id/status', personController.updatePersonStatus);

// [TEMP] Route to delete person with no job title
router.delete('/cleanup/delete-no-job-title', personController.deletePersonWithNoJobTitle);

module.exports = router;
