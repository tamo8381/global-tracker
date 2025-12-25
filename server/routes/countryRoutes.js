const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const countryController = require('../controllers/countryController');
const { protect, authorize } = require('../middleware/auth');

// Get all countries
router.get('/', countryController.getCountries);

// Get a single country by ID
router.get('/:id', countryController.getCountry);

// Create a new country
// Middleware to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array().map(e => e.msg).join(', '),
      message: errors.array().map(e => e.msg).join(', ')
    });
  }
  next();
};

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('code', 'Country code is required and must be 2-3 characters').isLength({ min: 2, max: 3 })
  ],
  handleValidation,
  countryController.createCountry
);

// Update a country
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('code', 'Country code must be 2-3 characters').optional().isLength({ min: 2, max: 3 })
  ],
  handleValidation,
  countryController.updateCountry
);

// Delete a country
router.delete('/:id', protect, authorize('admin'), countryController.deleteCountry);

// Get companies by country
router.get('/:id/companies', countryController.getCountryCompanies);

// Get people by country
router.get('/:id/people', countryController.getCountryPeople);

module.exports = router;
