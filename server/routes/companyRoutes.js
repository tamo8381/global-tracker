const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many export requests from this IP, please try again later.'
});

// Get all companies
router.get('/', companyController.getCompanies);

// Get a single company by ID
router.get('/:id', companyController.getCompany);

// Create a new company
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('name', 'Company name is required').not().isEmpty(),
    check('country', 'Country ID is required').isMongoId()
  ],
  companyController.createCompany
);

// Update a company
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    check('name', 'Company name is required').optional().not().isEmpty(),
    check('country', 'Invalid country ID').optional().isMongoId()
  ],
  companyController.updateCompany
);

// Delete a company
router.delete('/:id', protect, authorize('admin'), companyController.deleteCompany);

// Export company people (admin only)
router.get('/:id/export', protect, authorize('admin'), exportLimiter, companyController.exportPeople);

// Get people by company
router.get('/:id/people', companyController.getCompanyPeople);

// Add IP address to company (admin only)
router.post('/:id/ips', protect, authorize('admin'), companyController.addIpAddress);

// Remove IP address from company (admin only)
router.delete('/:id/ips/:ip', protect, authorize('admin'), companyController.removeIpAddress);

// Add subdomain to company (admin only)
router.post('/:id/subdomains', protect, authorize('admin'), companyController.addSubdomain);

// Remove subdomain from company (admin only)
router.delete('/:id/subdomains/:subdomain', protect, authorize('admin'), companyController.removeSubdomain);

module.exports = router;
