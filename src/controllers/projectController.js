const Project = require('../models/Project');
const User = require('../models/User');

// Get all projects
exports.getProjects = async (req, res) => {
    try {
        if (!req.session.userId) {
            req.flash('error', 'You must be logged in to view projects');
            return res.redirect('/users/login');
        }

        const projects = await Project.find({
            $or: [
                { owner: req.session.userId },
                { members: req.session.userId }
            ]
        })
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
        
        res.render('projects/index', { 
            projects,
            userId: req.session.userId,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        req.flash('error', 'Failed to fetch projects');
        res.render('projects/index', { 
            projects: [],
            userId: req.session.userId,
            user: req.user
        });
    }
};

// Get single project
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner')
            .populate('members');
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        res.render('projects/show', { 
            project,
            userId: req.session.userId 
        });
    } catch (error) {
        res.status(500).render('error', { error });
    }
};

// Create project form
exports.getCreateForm = (req, res) => {
    console.log('Rendering create project form');
    try {
        res.render('projects/create', {
            error: null,
            formData: null
        });
    } catch (error) {
        console.error('Error rendering create form:', error);
        res.status(500).render('error', { error });
    }
};

// Create project
exports.createProject = async (req, res) => {
    try {
        console.log('Create project attempt:', {
            userId: req.session.userId,
            body: req.body,
            path: req.path,
            method: req.method
        });

        if (!req.session.userId) {
            console.log('No user ID in session');
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(401).json({ success: false, error: 'You must be logged in to create a project' });
            }
            req.flash('error', 'You must be logged in to create a project');
            return res.redirect('/users/login');
        }

        const { title, description, deadline, status } = req.body;
        console.log('Project data:', { title, description, deadline, status });
        
        // Validate required fields
        if (!title || !description || !deadline) {
            console.log('Missing required fields:', { title, description, deadline });
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({ success: false, error: 'Please fill in all required fields' });
            }
            req.flash('error', 'Please fill in all required fields');
            return res.render('projects/create', { 
                error: 'Please fill in all required fields',
                formData: req.body
            });
        }

        // Create new project
        const project = new Project({
            title,
            description,
            deadline: new Date(deadline),
            status: status || 'planning',
            owner: req.session.userId,
            members: [] // Don't add owner as a member since they are already the owner
        });
        
        console.log('Created project object:', project);
        
        // Save project
        const savedProject = await project.save();
        console.log('Saved project:', savedProject);
        
        if (!savedProject) {
            console.log('Failed to save project');
            throw new Error('Failed to save project');
        }
        
        // Update user's projects array
        const updatedUser = await User.findByIdAndUpdate(
            req.session.userId,
            { $push: { projects: savedProject._id } },
            { new: true }
        );
        console.log('Updated user:', updatedUser);
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({ 
                success: true, 
                message: 'Project created successfully',
                project: savedProject
            });
        }
        
        req.flash('success', 'Project created successfully');
        res.redirect(`/projects/${savedProject._id}`);
    } catch (error) {
        console.error('Error creating project:', error);
        if (error.name === 'ValidationError') {
            console.log('Validation error:', error);
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({ success: false, error: 'Please fill in all required fields correctly' });
            }
            return res.render('projects/create', { 
                error: 'Please fill in all required fields correctly',
                formData: req.body
            });
        }
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({ success: false, error: 'Failed to create project' });
        }
        req.flash('error', 'Failed to create project');
        res.render('projects/create', { 
            error: 'An error occurred while creating the project',
            formData: req.body
        });
    }
};

// Edit project form
exports.getEditForm = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        if (project.owner.toString() !== req.session.userId) {
            return res.status(403).render('error', { error: 'Not authorized' });
        }
        res.render('projects/edit', { project });
    } catch (error) {
        res.status(500).render('error', { error });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        if (project.owner.toString() !== req.session.userId) {
            return res.status(403).render('error', { error: 'Not authorized' });
        }
        await Project.findByIdAndUpdate(req.params.id, req.body);
        res.redirect(`/projects/${req.params.id}`);
    } catch (error) {
        res.status(400).render('projects/edit', { error });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/projects');
        }
        if (project.owner.toString() !== req.session.userId) {
            req.flash('error', 'Not authorized to delete this project');
            return res.redirect('/projects');
        }
        await Project.findByIdAndDelete(req.params.id);
        req.flash('success', 'Project deleted successfully');
        res.redirect('/projects');
    } catch (error) {
        console.error('Error deleting project:', error);
        req.flash('error', 'Failed to delete project');
        res.redirect('/projects');
    }
};

// Add member to project
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            req.flash('error', 'User not found. Please make sure the email is correct and the user is registered.');
            return res.redirect(`/projects/${req.params.id}`);
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/projects');
        }

        // Check if user is trying to add themselves
        if (user._id.toString() === req.session.userId) {
            req.flash('error', 'You cannot add yourself as a member');
            return res.redirect(`/projects/${project._id}`);
        }
        
        await project.addMember(user._id);
        await user.updateOne({ $push: { projects: project._id } });
        
        req.flash('success', 'Member added successfully');
        res.redirect(`/projects/${project._id}`);
    } catch (error) {
        console.error('Error adding member:', error);
        req.flash('error', 'Failed to add member');
        res.redirect(`/projects/${req.params.id}`);
    }
};

// Add progress log
exports.addProgressLog = async (req, res) => {
    try {
        const { content } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        
        await project.addProgressLog(content, req.session.userId);
        res.redirect(`/projects/${project._id}`);
    } catch (error) {
        res.status(500).render('error', { error });
    }
};

// Remove member from project
exports.removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }

        // Only project owner can remove members
        if (project.owner.toString() !== req.session.userId) {
            return res.status(403).render('error', { error: 'Not authorized to remove members' });
        }

        const memberId = req.params.memberId;
        
        // Don't allow removing the owner
        if (memberId === project.owner.toString()) {
            return res.status(400).render('error', { error: 'Cannot remove project owner' });
        }

        // Remove member from project
        project.members = project.members.filter(m => m.toString() !== memberId);
        await project.save();

        // Remove project from user's projects array
        await User.findByIdAndUpdate(memberId, {
            $pull: { projects: project._id }
        });

        req.flash('success', 'Member removed successfully');
        res.redirect(`/projects/${project._id}`);
    } catch (error) {
        console.error('Error removing member:', error);
        req.flash('error', 'Failed to remove member');
        res.redirect(`/projects/${req.params.id}`);
    }
}; 