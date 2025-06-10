const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Show login form
exports.getLogin = (req, res) => {
    try {
        // Get message from query parameter
        const message = req.query.message;
        
        res.render('users/login', { 
            title: 'Login',
            user: null,
            error: null,
            success: message || null
        });
    } catch (error) {
        console.error('Error rendering login form:', error);
        res.status(500).render('error', { 
            message: 'Error rendering login form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Handle login
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            req.flash('error', 'Please provide both email and password');
            return res.render('users/login', {
                error: 'Please provide both email and password',
                formData: { email }
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login attempt failed: User not found for email:', email);
            req.flash('error', 'Invalid email or password');
            return res.render('users/login', {
                error: 'Invalid email or password',
                formData: { email }
            });
        }
        
        // Check password using the model's method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Login attempt failed: Invalid password for user:', email);
            req.flash('error', 'Invalid email or password');
            return res.render('users/login', {
                error: 'Invalid email or password',
                formData: { email }
            });
        }
        
        // Set user session
        req.session.userId = user._id;
        console.log('Login successful for user:', email);
        req.flash('success', 'Successfully logged in');
        res.redirect('/projects');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'An error occurred during login');
        res.render('users/login', {
            error: 'An error occurred during login',
            formData: req.body
        });
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
    try {
        // Store flash message before destroying session
        const flashMessage = 'You have been logged out successfully';
        
        // Clear any existing session data
        req.session.userId = null;
        
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).render('error', { 
                    message: 'An error occurred during logout',
                    error: process.env.NODE_ENV === 'development' ? err : {}
                });
            }
            
            // Clear the session cookie
            res.clearCookie('connect.sid', { 
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
            
            // Redirect to login page with success message in query parameter
            res.redirect('/users/login?message=' + encodeURIComponent(flashMessage));
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).render('error', { 
            message: 'An error occurred during logout',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
}; 