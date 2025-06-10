const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');

// Get all teams
exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('leader', 'name email')
            .populate('members.user', 'name email')
            .populate('projects', 'title status');
        res.render('teams/index', { teams });
    } catch (error) {
        req.session.error = 'Error fetching teams';
        res.redirect('/');
    }
};

// Get team creation form
exports.getCreateTeam = (req, res) => {
    res.render('teams/create');
};

// Create new team
exports.createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const team = new Team({
            name,
            description,
            leader: req.user._id
        });
        
        // Add creator as admin member
        await team.addMember(req.user._id, 'admin');
        await team.save();
        
        req.session.success = 'Team created successfully';
        res.redirect('/teams');
    } catch (error) {
        req.session.error = 'Error creating team';
        res.redirect('/teams/create');
    }
};

// Get team details
exports.getTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('leader', 'name email')
            .populate('members.user', 'name email')
            .populate('projects', 'title status deadline');
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Get available projects for this team
        const availableProjects = await Project.find({
            _id: { $nin: team.projects },
            owner: req.user._id
        });
        
        res.render('teams/show', { team, availableProjects });
    } catch (error) {
        req.session.error = 'Error fetching team details';
        res.redirect('/teams');
    }
};

// Get team edit form
exports.getEditTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to edit this team';
            return res.redirect('/teams');
        }
        
        res.render('teams/edit', { team });
    } catch (error) {
        req.session.error = 'Error fetching team';
        res.redirect('/teams');
    }
};

// Update team
exports.updateTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to edit this team';
            return res.redirect('/teams');
        }
        
        team.name = name;
        team.description = description;
        await team.save();
        
        req.session.success = 'Team updated successfully';
        res.redirect(`/teams/${team._id}`);
    } catch (error) {
        req.session.error = 'Error updating team';
        res.redirect('/teams');
    }
};

// Delete team
exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Only team leader can delete the team
        if (team.leader.toString() !== req.user._id.toString()) {
            req.session.error = 'Only team leader can delete the team';
            return res.redirect('/teams');
        }
        
        await team.remove();
        req.session.success = 'Team deleted successfully';
        res.redirect('/teams');
    } catch (error) {
        req.session.error = 'Error deleting team';
        res.redirect('/teams');
    }
};

// Add member to team
exports.addMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to add members';
            return res.redirect('/teams');
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            req.session.error = 'User not found';
            return res.redirect(`/teams/${team._id}`);
        }
        
        await team.addMember(user._id, role);
        req.session.success = 'Member added successfully';
        res.redirect(`/teams/${team._id}`);
    } catch (error) {
        req.session.error = 'Error adding member';
        res.redirect('/teams');
    }
};

// Remove member from team
exports.removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to remove members';
            return res.redirect('/teams');
        }
        
        await team.removeMember(memberId);
        req.session.success = 'Member removed successfully';
        res.redirect(`/teams/${team._id}`);
    } catch (error) {
        req.session.error = 'Error removing member';
        res.redirect('/teams');
    }
};

// Add project to team
exports.addProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to add projects';
            return res.redirect('/teams');
        }
        
        const project = await Project.findById(projectId);
        if (!project) {
            req.session.error = 'Project not found';
            return res.redirect(`/teams/${team._id}`);
        }
        
        await team.addProject(projectId);
        req.session.success = 'Project added to team successfully';
        res.redirect(`/teams/${team._id}`);
    } catch (error) {
        req.session.error = 'Error adding project to team';
        res.redirect('/teams');
    }
};

// Remove project from team
exports.removeProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }
        
        // Check if user is team leader or admin
        const isLeader = team.leader.toString() === req.user._id.toString();
        const isAdmin = team.members.some(member => 
            member.user.toString() === req.user._id.toString() && 
            member.role === 'admin'
        );
        
        if (!isLeader && !isAdmin) {
            req.session.error = 'You do not have permission to remove projects';
            return res.redirect('/teams');
        }
        
        await team.removeProject(projectId);
        req.session.success = 'Project removed from team successfully';
        res.redirect(`/teams/${team._id}`);
    } catch (error) {
        req.session.error = 'Error removing project from team';
        res.redirect('/teams');
    }
}; 