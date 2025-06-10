const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register form
exports.registerForm = (req, res) => {
    if (req.user) {
        return res.redirect('/projects');
    }
    res.render('users/register', { error: null });
};

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.render('users/register', {
                error: 'Please fill in all required fields',
                formData: req.body
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('users/register', {
                error: 'Email already registered',
                formData: req.body
            });
        }
        
        // Create new user
        const user = new User({ name, email, password });
        
        await user.save();
        
        // Set session
        req.session.userId = user._id;
        req.flash('success', 'Registration successful! Welcome to our platform.');
        
        res.redirect('/projects');
    } catch (error) {
        res.render('users/register', { 
            error: 'An error occurred during registration',
            formData: req.body
        });
    }
};

// Login form
exports.loginForm = (req, res) => {
    if (req.user) {
        return res.redirect('/projects');
    }
    res.render('users/login', { error: null });
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.render('users/login', {
                error: 'Please fill in all required fields',
                formData: req.body
            });
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('users/login', {
                error: 'No account found with this email',
                formData: req.body
            });
        }
        
        // Check password
        try {
            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                return res.render('users/login', {
                    error: 'Incorrect password. Please try again or use the password you set during registration',
                    formData: req.body
                });
            }

            // Check if password needs to be rehashed
            await user.checkPasswordRehash();
            
            // Set session
            req.session.userId = user._id;
            req.flash('success', 'Welcome back!');
            
            res.redirect('/projects');
        } catch (error) {
            return res.render('users/login', {
                error: 'An error occurred during login',
                formData: req.body
            });
        }
    } catch (error) {
        res.render('users/login', { 
            error: 'An error occurred during login',
            formData: req.body
        });
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).render('error', { error: 'Error during logout' });
        }
        res.clearCookie('connect.sid');
        req.flash('success', 'You have been logged out successfully');
        res.redirect('/users/login');
    });
};

// User profile
exports.profile = async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'Please log in to view your profile');
            return res.redirect('/users/login');
        }

        const user = await User.findById(req.session.userId)
            .populate({
                path: 'projects',
                select: 'title description status createdAt'
            })
            .populate({
                path: 'teams',
                select: 'name description members'
            });
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/users/login');
        }
        
        // Ensure projects and teams are arrays
        user.projects = user.projects || [];
        user.teams = user.teams || [];
        
        res.render('users/profile', { 
            user,
            title: 'My Profile',
            error: req.flash('error')[0] || null,
            success: req.flash('success')[0] || null
        });
    } catch (error) {
        req.flash('error', 'Error loading profile');
        res.redirect('/users/login');
    }
};

// Get edit profile form
exports.getEditProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/users/login');
        }

        res.render('users/edit', { 
            user,
            title: 'Edit Profile',
            error: req.flash('error')[0] || null,
            success: req.flash('success')[0] || null
        });
    } catch (error) {
        console.error('Error loading edit profile form:', error);
        req.flash('error', 'Error loading edit profile form');
        res.redirect('/users/login');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/users/login');
        }

        // Check if email is already taken by another user
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.render('users/edit', {
                    user,
                    error: 'Email is already taken',
                    title: 'Edit Profile'
                });
            }
        }

        // Update user fields
        user.name = name;
        user.email = email;

        // Update password if provided
        if (newPassword) {
            // Validate current password only if changing password
            if (!currentPassword) {
                return res.render('users/edit', {
                    user,
                    error: 'Current password is required to change password',
                    title: 'Edit Profile'
                });
            }

            const isValidPassword = await user.comparePassword(currentPassword);
            if (!isValidPassword) {
                return res.render('users/edit', {
                    user,
                    error: 'Current password is incorrect',
                    title: 'Edit Profile'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.render('users/edit', {
                    user,
                    error: 'New passwords do not match',
                    title: 'Edit Profile'
                });
            }
            user.password = newPassword;
        }

        await user.save();
        req.flash('success', 'Profile updated successfully');
        res.redirect('/users/login');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error', 'Error updating profile');
        res.redirect('/users/login');
    }
}; 