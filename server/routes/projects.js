const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, requireAdmin } = require('../middleware/auth');

const getMemberId = (m) => (m.user._id || m.user).toString();
const isMember = (project, userId) => project.members.some(m => getMemberId(m) === userId.toString());
const getUserRole = (project, userId) => {
  const m = project.members.find(m => getMemberId(m) === userId.toString());
  return m ? m.role : null;
};

// @GET /api/projects - Get all projects for current user
router.get('/', protect, async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      return { ...p.toObject(), taskCount, userRole: getUserRole(p, req.user._id) };
    }));

    res.json({ success: true, projects: projectsWithCounts });
  } catch (err) { next(err); }
});

// @POST /api/projects - Create project
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('description').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, description, color } = req.body;
    const project = await Project.create({
      name, description, color,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    await project.populate('members.user', 'name email');
    res.status(201).json({ success: true, project: { ...project.toObject(), userRole: 'Admin' } });
  } catch (err) { next(err); }
});

// @GET /api/projects/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, project: { ...project.toObject(), userRole: getUserRole(project, req.user._id) } });
  } catch (err) { next(err); }
});

// @PUT /api/projects/:id - Update project (Admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (getUserRole(project, req.user._id) !== 'Admin') return res.status(403).json({ success: false, message: 'Admin required' });

    const { name, description, color } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ success: true, project: { ...project.toObject(), userRole: 'Admin' } });
  } catch (err) { next(err); }
});

// @DELETE /api/projects/:id (Admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (getUserRole(project, req.user._id) !== 'Admin') return res.status(403).json({ success: false, message: 'Admin required' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
});

// @POST /api/projects/:id/members - Add member (Admin only)
router.post('/:id/members', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (getUserRole(project, req.user._id) !== 'Admin') return res.status(403).json({ success: false, message: 'Admin required' });

    const { email, role = 'Member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found with that email' });
    if (isMember(project, user._id)) return res.status(400).json({ success: false, message: 'User already a member' });

    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ success: true, project });
  } catch (err) { next(err); }
});

// @DELETE /api/projects/:id/members/:userId (Admin only)
router.delete('/:id/members/:userId', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (getUserRole(project, req.user._id) !== 'Admin') return res.status(403).json({ success: false, message: 'Admin required' });
    if (req.params.userId === project.createdBy.toString()) return res.status(400).json({ success: false, message: 'Cannot remove project creator' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ success: true, project });
  } catch (err) { next(err); }
});

module.exports = router;
