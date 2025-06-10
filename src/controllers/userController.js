const User = require('../models/User');

// Register form
exports.registerForm = (req, res) => {
    res.render('users/register');
};

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('users/register', {
                error: 'Email already registered'
            });
        }
        
        // Create new user
        const user = new User({ name, email, password });
        await user.save();
        
        // Set session
        req.session.userId = user._id;
        
        res.redirect('/projects');
    } catch (error) {
        res.status(400).render('users/register', { error });
    }
};

// Login form
exports.loginForm = (req, res) => {
    res.render('users/login');
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('users/login', {
                error: 'Invalid email or password'
            });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).render('users/login', {
                error: 'Invalid email or password'
            });
        }
        
        // Set session
        req.session.userId = user._id;
        
        res.redirect('/projects');
    } catch (error) {
        res.status(500).render('users/login', { error });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).render('error', { error: err });
        }
        res.redirect('/users/login');
    });
};

// User profile
exports.profile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .populate('projects');
        
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' });
        }
        
        res.render('users/profile', { user });
    } catch (error) {
        res.status(500).render('error', { error });
    }
}; 