const User = require('../models/User');
const Project = require('../models/Project');

const isAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                req.session.destroy();
                return res.redirect('/users/login');
            }
            req.user = user;
            return next();
        } catch (error) {
            console.error('Error loading user:', error);
            return res.redirect('/users/login');
        }
    }
    res.redirect('/users/login');
};

const isProjectOwner = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        
        if (project.owner.toString() !== req.session.userId) {
            return res.status(403).render('error', { error: 'Access denied' });
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    isAuthenticated,
    isProjectOwner
}; 