const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['member', 'admin'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
teamSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add member to team
teamSchema.methods.addMember = async function(userId, role = 'member') {
    if (!this.members.some(member => member.user.toString() === userId.toString())) {
        this.members.push({
            user: userId,
            role: role,
            joinedAt: Date.now()
        });
        return this.save();
    }
    return this;
};

// Remove member from team
teamSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => member.user.toString() !== userId.toString());
    return this.save();
};

// Add project to team
teamSchema.methods.addProject = async function(projectId) {
    if (!this.projects.includes(projectId)) {
        this.projects.push(projectId);
        return this.save();
    }
    return this;
};

// Remove project from team
teamSchema.methods.removeProject = async function(projectId) {
    this.projects = this.projects.filter(project => project.toString() !== projectId.toString());
    return this.save();
};

module.exports = mongoose.model('Team', teamSchema); 