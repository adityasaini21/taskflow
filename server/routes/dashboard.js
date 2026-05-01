const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @GET /api/dashboard - Global dashboard for user
router.get('/', protect, async (req, res, next) => {
  try {
    const userProjects = await Project.find({ 'members.user': req.user._id }).select('_id name');
    const projectIds = userProjects.map(p => p._id);

    const [totalTasks, byStatus, overdueTasks, recentTasks] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' }
      }),
      Task.find({ project: { $in: projectIds } })
        .populate('assignedTo', 'name email')
        .populate('project', 'name color')
        .sort('-createdAt')
        .limit(5)
    ]);

    const myTasks = await Task.countDocuments({ assignedTo: req.user._id, project: { $in: projectIds } });
    const myOverdue = await Task.countDocuments({
      assignedTo: req.user._id,
      project: { $in: projectIds },
      dueDate: { $lt: new Date() },
      status: { $ne: 'Done' }
    });

    res.json({
      success: true,
      dashboard: {
        totalProjects: userProjects.length,
        totalTasks,
        myTasks,
        overdueTasks,
        myOverdue,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        recentTasks
      }
    });
  } catch (err) { next(err); }
});

// @GET /api/dashboard/project/:id - Project-specific dashboard
router.get('/project/:id', protect, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const [byStatus, byPriority, byUser, overdueTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: project._id, assignedTo: { $exists: true } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { count: 1, 'user.name': 1, 'user.email': 1 } }
      ]),
      Task.find({
        project: project._id,
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' }
      }).populate('assignedTo', 'name email').limit(10)
    ]);

    res.json({
      success: true,
      dashboard: {
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byPriority: byPriority.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byUser,
        overdueTasks,
        totalMembers: project.members.length
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
