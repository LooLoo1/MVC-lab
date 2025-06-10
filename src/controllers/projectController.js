const Project = require('../models/Project');
const User = require('../models/User');

// Get all projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('owner');
        res.render('projects/index', { 
            projects,
            userId: req.session.userId 
        });
    } catch (error) {
        res.status(500).render('error', { error });
    }
};

// Get single project
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('owner');
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
    res.render('projects/create');
};

// Create project
exports.createProject = async (req, res) => {
    try {
        const project = new Project({
            ...req.body,
            owner: req.session.userId
        });
        await project.save();
        res.redirect('/projects');
    } catch (error) {
        res.status(400).render('projects/create', { error });
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
            return res.status(404).render('error', { error: 'Project not found' });
        }
        if (project.owner.toString() !== req.session.userId) {
            return res.status(403).render('error', { error: 'Not authorized' });
        }
        await Project.findByIdAndDelete(req.params.id);
        res.redirect('/projects');
    } catch (error) {
        res.status(500).render('error', { error });
    }
};

// Add member to project
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).render('error', { error: 'User not found' });
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).render('error', { error: 'Project not found' });
        }
        
        await project.addMember(user._id);
        await user.updateOne({ $push: { projects: project._id } });
        
        res.redirect(`/projects/${project._id}`);
    } catch (error) {
        res.status(500).render('error', { error });
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