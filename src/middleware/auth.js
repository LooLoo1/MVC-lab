const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const mongoose = require('mongoose');

const isAuthenticated = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'Please log in to access this page');
            return res.redirect('/users/login');
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            req.flash('error', 'Your session has expired. Please log in again.');
            return res.redirect('/users/login');
        }

        // Attach user to request object
        req.user = user;
        res.locals.user = user; // Make user available in all views
        next();
    } catch (error) {
        console.error('Error in authentication:', error);
        req.flash('error', 'An error occurred during authentication');
        res.redirect('/users/login');
    }
};

const hasRole = (roles) => (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'Please log in to access this page');
        return res.redirect('/users/login');
    }

    if (roles.includes(req.user.role)) {
        return next();
    }

    req.flash('error', 'Access denied: insufficient permissions');
    res.redirect('back');
};

const isProjectMember = async (req, res, next) => {
    try {
        // Skip middleware for project creation and listing routes
        if (req.path === '/create' || req.path === '/' || (req.path === '/' && req.method === 'POST')) {
            return next();
        }

        // Get project ID from params
        const projectId = req.params.id || req.params.projectId;
        
        // If no project ID is provided, skip the middleware
        if (!projectId) {
            return next();
        }

        // Validate project ID format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            console.log('Invalid project ID format:', projectId);
            req.flash('error', 'Invalid project ID');
            return res.redirect('/projects');
        }

        // Find project
        const project = await Project.findById(projectId)
            .populate('members')
            .populate('owner');
            
        if (!project) {
            console.log('Project not found:', projectId);
            req.flash('error', 'Project not found');
            return res.redirect('/projects');
        }

        // Check if user is authenticated
        if (!req.user) {
            console.log('No authenticated user');
            req.flash('error', 'Please log in to access this project');
            return res.redirect('/users/login');
        }

        // Check if user is a member or owner
        const isMember = project.members.some(m => m._id.toString() === req.user._id.toString()) || 
                        project.owner._id.toString() === req.user._id.toString();

        if (!isMember) {
            console.log('User is not a member:', {
                userId: req.user._id,
                projectId: project._id,
                members: project.members.map(m => m._id),
                owner: project.owner._id
            });
            req.flash('error', 'You are not a member of this project');
            return res.redirect('/projects');
        }

        // Attach project to request
        req.project = project;
        next();
    } catch (err) {
        console.error('Error in isProjectMember middleware:', err);
        req.flash('error', 'An error occurred while checking project membership');
        res.redirect('/projects');
    }
};

const isTeamMember = async (req, res, next) => {
    try {
        if (!req.user) {
            req.flash('error', 'Please log in to access this team');
            return res.redirect('/users/login');
        }

        const teamId = req.params.id || req.params.teamId;
        if (!mongoose.Types.ObjectId.isValid(teamId)) {
            req.flash('error', 'Invalid team ID');
            return res.redirect('/teams');
        }

        const team = await Team.findById(teamId)
            .populate('members.user')
            .populate('leader');
            
        if (!team) {
            req.flash('error', 'Team not found');
            return res.redirect('/teams');
        }

        const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString()) || 
                        team.leader._id.toString() === req.user._id.toString();

        if (!isMember) {
            req.flash('error', 'You are not a member of this team');
            return res.redirect('/teams');
        }

        req.team = team;
        next();
    } catch (err) {
        console.error('Error in isTeamMember middleware:', err);
        req.flash('error', 'An error occurred while checking team membership');
        res.redirect('/teams');
    }
};

module.exports = {
    isAuthenticated,
    hasRole,
    isProjectMember,
    isTeamMember
}; 