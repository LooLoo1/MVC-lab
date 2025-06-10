const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Team routes
router.get('/', teamController.getTeams);
router.get('/create', teamController.getCreateTeam);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeam);
router.get('/:id/edit', teamController.getEditTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

// Team member management routes
router.post('/:id/members', teamController.addMember);
router.delete('/:id/members/:memberId', teamController.removeMember);

// Team project management routes
router.post('/:id/projects', teamController.addProjectToTeam);
router.delete('/:id/projects/:projectId', teamController.removeProject);

module.exports = router; 