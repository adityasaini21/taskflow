const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const isMember = (project, userId) => project.members.some(m => m.user.toString() === userId.toString());
const getUserRole = (project, userId) => {
  const m = project.members.find(m => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

// @GET /api/tasks?project=id - Get tasks for a project
router.get('/', protect, async (req, res, next) => {
  try {
    const { project: projectId, status, priority, assignedTo } = req.query;
    if (!projectId) return res.status(400).json({ success: false, message: 'Project ID required' });

    const project = await Project.findById(projectId);
    if (!project || !isMember(project, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const userRole = getUserRole(project, req.user._id);
    if (userRole === 'Member') {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, tasks });
  } catch (err) { next(err); }
});

// @POST /api/tasks - Create task (Admin only)
router.post('/', protect, [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('project').notEmpty().withMessage('Project ID required'),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']),
  body('priority').optional().isIn(['Low', 'Medium', 'High'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { title, description, status, priority, dueDate, project: projectId, assignedTo } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ success: false, message: 'Not a project member' });
    if (role !== 'Admin') return res.status(403).json({ success: false, message: 'Only admins can create tasks' });

    const task = await Task.create({
      title, description, status, priority, dueDate, project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
});

// @GET /api/tasks/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!isMember(project, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// @PUT /api/tasks/:id - Update task
router.put('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    const role = getUserRole(project, req.user._id);
    if (!role) return res.status(403).json({ success: false, message: 'Access denied' });

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (role === 'Member') {
      // Members can only update status of their assigned tasks
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you' });
      }
      if (status) task.status = status;
    } else {
      // Admin can update everything
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// @DELETE /api/tasks/:id (Admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (getUserRole(project, req.user._id) !== 'Admin') return res.status(403).json({ success: false, message: 'Admin required' });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
