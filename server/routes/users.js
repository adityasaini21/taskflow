const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @GET /api/users/search?email= - Search user by email (for adding to project)
router.get('/search', protect, async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email query required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with that email' });

    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

module.exports = router;
