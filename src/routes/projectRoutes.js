const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { isAuthenticated, isProjectOwner } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Project routes
router.get('/', projectController.getProjects);
router.get('/new', projectController.getCreateForm);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.get('/:id/edit', projectController.getEditForm);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Project member and progress routes
router.post('/:id/members', isProjectOwner, projectController.addMember);
router.post('/:id/progress', projectController.addProgressLog);

module.exports = router; 