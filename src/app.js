const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('connect-flash');
const { isAuthenticated } = require('./middleware/auth');
const Notification = require('./models/Notification');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://vam:123@cluster0.rd5knl1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Session configuration
app.use(session({
    secret: 'your-super-secret-key-change-this-in-production',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // = 14 days
    }),
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000, // = 14 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Flash messages middleware
app.use(flash());

// Make user available to all views
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const User = require('./models/User');
            const user = await User.findById(req.session.userId);
            res.locals.user = user;
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }
    next();
});

// Make flash messages available to all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Import notification controller
const notificationController = require('./controllers/notificationController');

// Add notification count middleware
app.use(notificationController.getUnreadCount);

// Database connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const projectRoutes = require('./routes/projectRoutes');
const teamRoutes = require('./routes/teamRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Auth routes (including login, register, logout)
app.use('/', authRoutes);

// User routes
app.use('/', userRoutes);

// Protected routes (authentication required)
app.use('/projects', isAuthenticated, projectRoutes);
app.use('/teams', isAuthenticated, teamRoutes);
app.use('/notifications', isAuthenticated, require('./routes/notificationRoutes'));

// Home route
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/projects');
    } else {
        res.redirect('/users/login');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Get unread notifications count for the error page
    let unreadNotifications = 0;
    const user = res.locals.user || null;

    // If user exists, try to get notification count
    if (user) {
        Notification.countDocuments({ recipient: user._id, read: false })
            .then(count => {
                unreadNotifications = count;
                renderErrorPage();
            })
            .catch(() => {
                renderErrorPage();
            });
    } else {
        renderErrorPage();
    }

    function renderErrorPage() {
        res.status(err.status || 500).render('error', {
            message: err.message || 'An error occurred',
            error: process.env.NODE_ENV === 'development' ? err : {},
            user: user,
            unreadNotifications: unreadNotifications
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
