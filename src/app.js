const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

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
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // = 14 days
    }),
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000 // = 14 days
    }
}));

// Flash messages middleware
app.use((req, res, next) => {
    res.locals.success = req.session.success;
    res.locals.error = req.session.error;
    delete req.session.success;
    delete req.session.error;
    next();
});

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

// Database connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const teamRoutes = require('./routes/teamRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/', authRoutes);
app.use('/projects', projectRoutes);
app.use('/teams', teamRoutes);
app.use('/users', userRoutes);

// Home route
app.get('/', (req, res) => {
    res.redirect('/projects');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: err });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
