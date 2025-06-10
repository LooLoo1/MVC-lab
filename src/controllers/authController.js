const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get login form
exports.getLogin = (req, res) => {
    res.render('users/login');
};

// Handle login
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }
        
        // Set user session
        req.session.userId = user._id;
        req.flash('success', 'Successfully logged in');
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/users/login');
    }
};

// Get registration form
exports.getRegister = (req, res) => {
    res.render('users/register');
};

// Handle registration
exports.postRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/users/register');
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        // Set user session
        req.session.userId = user._id;
        req.flash('success', 'Registration successful');
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.redirect('/users/register');
    }
};

// Handle logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/users/login');
    });
}; 