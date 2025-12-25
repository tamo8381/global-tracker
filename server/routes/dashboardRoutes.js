const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Get system overview
router.get('/overview', dashboardController.getSystemOverview);

// Get recent activities
router.get('/activities', dashboardController.getRecentActivities);

module.exports = router;
