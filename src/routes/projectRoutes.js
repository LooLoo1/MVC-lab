const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { isProjectMember } = require('../middleware/auth');

// Public routes (no membership check needed)
router.get('/', projectController.getProjects);
router.get('/create', projectController.getCreateForm);
router.post('/', projectController.createProject);

// Protected routes (require membership)
router.use('/:id', isProjectMember); // Apply middleware to all routes with project ID
router.get('/:id', projectController.getProject);
router.get('/:id/edit', projectController.getEditForm);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:memberId', projectController.removeMember);

module.exports = router; 