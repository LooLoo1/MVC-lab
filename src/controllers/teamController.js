const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const notificationController = require('./notificationController');
const Notification = require('../models/Notification');

// Get all teams
exports.getAllTeams = async (req, res) => {
    try {
        const { search, status, sort } = req.query;
        let query = {
            $or: [
                { leader: req.session.userId },
                { 'members.user': req.session.userId }
            ]
        };

        // Search by name or description
        if (search) {
            query.$and = [{
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }];
        }

        // Filter by status (active/inactive)
        if (status) {
            query.status = status;
        }

        // Build sort object
        let sortObj = { createdAt: -1 }; // Default sort by newest
        if (sort) {
            switch (sort) {
                case 'name_asc':
                    sortObj = { name: 1 };
                    break;
                case 'name_desc':
                    sortObj = { name: -1 };
                    break;
                case 'members_asc':
                    sortObj = { 'members.length': 1 };
                    break;
                case 'members_desc':
                    sortObj = { 'members.length': -1 };
                    break;
            }
        }

        const teams = await Team.find(query)
            .sort(sortObj)
            .populate('leader', 'name email')
            .populate('members.user', 'name email');

        // Get team statistics
        const stats = {
            total: teams.length,
            active: teams.filter(t => t.status === 'active').length,
            inactive: teams.filter(t => t.status === 'inactive').length
        };

        res.render('teams/index', { 
            teams,
            stats,
            search,
            status,
            sort,
            userId: req.session.userId
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).render('error', { error });
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
            .populate('projects', 'name description');

        if (!team) {
            req.flash('error', 'Team not found');
            return res.redirect('/teams');
        }

        // Check if current user is the team leader
        const isLeader = team.leader && team.leader._id.toString() === req.session.userId;

        res.render('teams/show', {
            team,
            isLeader,
            title: team.name
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        req.flash('error', 'Error fetching team details');
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
            return res.status(404).json({ 
                success: false, 
                error: 'Team not found' 
            });
        }

        // Check if user is team leader
        if (team.leader.toString() !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Not authorized to add members' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if user is already a member
        if (team.members.some(member => member.user.toString() === user._id.toString())) {
            return res.status(400).json({ 
                success: false, 
                error: 'User is already a member of this team' 
            });
        }

        // Add member to team
        await team.addMember(user._id, role);

        // Create notification for the new member
        await Notification.create({
            recipient: user._id,
            sender: req.session.userId,
            team: team._id,
            type: 'team_invite',
            title: 'Team Invitation',
            message: `You have been invited to join the team "${team.name}"`,
            link: `/teams/${team._id}`
        });

        res.json({ 
            success: true,
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add team member' 
        });
    }
};

// Remove member from team
exports.removeMember = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if user has permission
        if (team.leader._id.toString() !== req.user._id.toString() && 
            !team.members.some(m => m.user._id.toString() === req.user._id.toString() && m.role === 'admin')) {
            return res.status(403).json({ error: 'Not authorized to remove members' });
        }

        const memberId = req.params.memberId;
        const member = team.members.find(m => m.user._id.toString() === memberId);
        
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Don't allow removing the team leader
        if (memberId === team.leader._id.toString()) {
            return res.status(400).json({ error: 'Cannot remove team leader' });
        }

        team.members = team.members.filter(m => m.user._id.toString() !== memberId);
        await team.save();

        // Send notification to the removed member
        await notificationController.createNotification({
            recipient: memberId,
            sender: req.user._id,
            type: 'status_update',
            title: 'Team Membership Update',
            message: `You have been removed from the team "${team.name}"`,
            team: team._id
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error removing member' });
    }
};

// Add project to team
exports.addProject = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            req.session.error = 'Team not found';
            return res.redirect('/teams');
        }

        // Check if user has permission
        if (team.leader._id.toString() !== req.user._id.toString() && 
            !team.members.some(m => m.user._id.toString() === req.user._id.toString() && m.role === 'admin')) {
            req.session.error = 'Not authorized to add projects';
            return res.redirect('/teams');
        }

        const { projectId } = req.body;
        const project = await Project.findById(projectId);
        
        if (!project) {
            req.session.error = 'Project not found';
            return res.redirect('/teams');
        }

        // Check if project is already assigned to the team
        if (team.projects.includes(projectId)) {
            req.session.error = 'Project is already assigned to this team';
            return res.redirect('/teams');
        }

        team.projects.push(projectId);
        await team.save();

        // Send notifications to all team members
        const notifications = team.members.map(member => ({
            recipient: member.user,
            sender: req.user._id,
            type: 'project_assigned',
            title: 'New Project Assigned',
            message: `Project "${project.title}" has been assigned to your team "${team.name}"`,
            link: `/projects/${project._id}`,
            team: team._id,
            project: project._id
        }));

        // Also notify the team leader
        notifications.push({
            recipient: team.leader._id,
            sender: req.user._id,
            type: 'project_assigned',
            title: 'New Project Assigned',
            message: `Project "${project.title}" has been assigned to your team "${team.name}"`,
            link: `/projects/${project._id}`,
            team: team._id,
            project: project._id
        });

        await Promise.all(notifications.map(n => notificationController.createNotification(n)));

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
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if user has permission
        if (team.leader._id.toString() !== req.user._id.toString() && 
            !team.members.some(m => m.user._id.toString() === req.user._id.toString() && m.role === 'admin')) {
            return res.status(403).json({ error: 'Not authorized to remove projects' });
        }

        const projectId = req.params.projectId;
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        team.projects = team.projects.filter(p => p.toString() !== projectId);
        await team.save();

        // Send notifications to all team members
        const notifications = team.members.map(member => ({
            recipient: member.user,
            sender: req.user._id,
            type: 'status_update',
            title: 'Project Removed',
            message: `Project "${project.title}" has been removed from your team "${team.name}"`,
            team: team._id,
            project: project._id
        }));

        // Also notify the team leader
        notifications.push({
            recipient: team.leader._id,
            sender: req.user._id,
            type: 'status_update',
            title: 'Project Removed',
            message: `Project "${project.title}" has been removed from your team "${team.name}"`,
            team: team._id,
            project: project._id
        });

        await Promise.all(notifications.map(n => notificationController.createNotification(n)));

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error removing project from team' });
    }
}; 