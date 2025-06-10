const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get login form
exports.getLogin = (req, res) => {
    res.render('users/login', { user: null });
};

// Handle login
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login attempt failed: User not found for email:', email);
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }
        
        // Check password using the model's method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Login attempt failed: Invalid password for user:', email);
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }
        
        // Set user session
        req.session.userId = user._id;
        console.log('Login successful for user:', email);
        req.flash('success', 'Successfully logged in');
        res.redirect('/projects');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.redirect('/users/login');
    }
};

// Get registration form
exports.getRegister = (req, res) => {
    res.render('users/register', { user: null });
};

// Handle registration
exports.postRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.render('users/register', { 
                user: null,
                formData: { name, email },
                error: 'Email already registered'
            });
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
        req.flash('success', 'Registration successful! Welcome to our platform.');
        res.redirect('/projects');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.render('users/register', { 
            user: null,
            formData: req.body,
            error: 'An error occurred during registration'
        });
    }
};

// Handle logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).render('error', { error: 'Error during logout' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/users/login');
    });
}; 