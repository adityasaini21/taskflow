const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

exports.requireAdmin = (projectField = 'project') => async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const projectId = req.params.projectId || req.body.project || req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};
