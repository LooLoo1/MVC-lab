const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/users/login', authController.getLogin);
router.post('/users/login', authController.postLogin);
router.get('/users/register', authController.getRegister);
router.post('/users/register', authController.postRegister);

// Protected routes (authentication required)
router.get('/users/logout', isAuthenticated, authController.logout);

module.exports = router; 