const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Auth routes
router.get('/users/login', authController.getLogin);
router.post('/users/login', authController.postLogin);
router.get('/users/register', authController.getRegister);
router.post('/users/register', authController.postRegister);
router.get('/users/logout', isAuthenticated, authController.logout);

module.exports = router; 