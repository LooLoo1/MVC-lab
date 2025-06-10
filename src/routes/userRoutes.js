const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/register', userController.registerForm);
router.post('/register', userController.register);
router.get('/login', userController.loginForm);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', isAuthenticated, userController.profile);
router.get('/edit', isAuthenticated, userController.getEditProfile);
router.post('/profile', isAuthenticated, userController.updateProfile);

module.exports = router; 