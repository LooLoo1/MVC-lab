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
        console.log('Registration attempt for email:', email);
        
        // Validate input
        if (!name || !email || !password) {
            console.log('Missing required fields');
            return res.render('users/register', {
                error: 'Please fill in all required fields',
                formData: req.body
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Email already registered:', email);
            return res.render('users/register', {
                error: 'Email already registered',
                formData: req.body
            });
        }
        
        // Create new user
        console.log('Creating new user with email:', email);
        const user = new User({ name, email, password });
        console.log('User object before save:', {
            name: user.name,
            email: user.email,
            password: user.password // This will show the hashed password
        });
        
        await user.save();
        console.log('User saved successfully:', {
            id: user._id,
            email: user.email,
            password: user.password // This will show the final hashed password
        });
        
        // Set session
        req.session.userId = user._id;
        req.flash('success', 'Registration successful! Welcome to our platform.');
        
        console.log('Registration successful for user:', email);
        res.redirect('/projects');
    } catch (error) {
        console.error('Registration error:', error);
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
        console.log('Login attempt for email:', email);
        
        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.render('users/login', {
                error: 'Please fill in all required fields',
                formData: req.body
            });
        }
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.render('users/login', {
                error: 'No account found with this email',
                formData: req.body
            });
        }
        console.log('User found:', user.email);
        
        // Check password
        try {
            const isMatch = await user.comparePassword(password);
            console.log('Password match result:', isMatch);
            
            if (!isMatch) {
                console.log('Invalid password for user:', email);
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
            
            console.log('Login successful for user:', email);
            res.redirect('/projects');
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.render('users/login', {
                error: 'An error occurred during login',
                formData: req.body
            });
        }
    } catch (error) {
        console.error('Login error:', error);
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
            console.error('Logout error:', err);
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
        console.log('Loading profile for user ID:', req.session.userId);
        
        if (!req.session.userId) {
            console.log('No user ID in session');
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
        
        console.log('Found user:', user ? 'yes' : 'no');
        
        if (!user) {
            console.log('User not found in database');
            req.flash('error', 'User not found');
            return res.redirect('/users/login');
        }
        
        // Ensure projects and teams are arrays
        user.projects = user.projects || [];
        user.teams = user.teams || [];
        
        console.log('User projects count:', user.projects.length);
        console.log('User teams count:', user.teams.length);
        
        res.render('users/profile', { 
            user,
            title: 'My Profile',
            error: req.flash('error')[0] || null,
            success: req.flash('success')[0] || null
        });
    } catch (error) {
        console.error('Profile error details:', error);
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