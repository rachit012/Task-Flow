const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.fullProfile
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', validateProfileUpdate, authenticateToken, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

      const { name, email } = req.body;

  // Check if email is being changed and if it already exists
  if (email && email !== req.user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // Update user profile
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: name || req.user.name,
      email: email || req.user.email,
      // avatar field removed
    },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.fullProfile
    }
  });
}));

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', validatePasswordChange, authenticateToken, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @route   GET /api/users/tasks
// @desc    Get tasks assigned to current user
// @access  Private
router.get('/tasks', authenticateToken, asyncHandler(async (req, res) => {
  const { status, priority, overdue } = req.query;
  
  let filter = { assignedTo: req.user._id };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.isCompleted = false;
  }

  const tasks = await Task.find(filter)
    .populate('project', 'name')
            .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
    .sort({ dueDate: 1, priority: -1 });

  res.json({
    success: true,
    data: {
      tasks,
      count: tasks.length
    }
  });
}));

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  // Get user's projects
  const projects = await Project.find({
    $or: [
      { owner: req.user._id },
      { 'team.user': req.user._id }
    ]
  }).select('_id name status');

  const projectIds = projects.map(p => p._id);

  // Get task statistics
  const totalTasks = await Task.countDocuments({ 
    assignedTo: req.user._id 
  });
  
  const completedTasks = await Task.countDocuments({ 
    assignedTo: req.user._id, 
    isCompleted: true 
  });
  
  const overdueTasks = await Task.countDocuments({
    assignedTo: req.user._id,
    dueDate: { $lt: new Date() },
    isCompleted: false
  });

  const todayTasks = await Task.countDocuments({
    assignedTo: req.user._id,
    dueDate: {
      $gte: new Date().setHours(0, 0, 0, 0),
      $lt: new Date().setHours(23, 59, 59, 999)
    }
  });

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = await Task.find({
    assignedTo: req.user._id,
    dueDate: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    isCompleted: false
  })
  .populate('project', 'name')
  .sort({ dueDate: 1 })
  .limit(10);

  // Get tasks by status
  const tasksByStatus = await Task.aggregate([
    { $match: { assignedTo: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get tasks by priority
  const tasksByPriority = await Task.aggregate([
    { $match: { assignedTo: req.user._id } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        todayTasks,
        completionRate
      },
      upcomingTasks,
      tasksByStatus,
      tasksByPriority,
      projects: projects.length
    }
  });
}));

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (admin)
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const { search, role, isActive } = req.query;
  
  let filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const users = await User.find(filter)
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      users,
      count: users.length
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (admin)
router.get('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshTokens');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: {
      user: user.fullProfile
    }
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (admin)
router.put('/:id', validateProfileUpdate, authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email, role, isActive } = req.body;

  // Check if email is being changed and if it already exists
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser.fullProfile
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (admin)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is trying to delete themselves
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  // Check if user owns any projects
  const ownedProjects = await Project.countDocuments({ owner: user._id });
  if (ownedProjects > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user who owns projects'
    });
  }

  // Check if user has assigned tasks
  const assignedTasks = await Task.countDocuments({ assignedTo: user._id });
  if (assignedTasks > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user who has assigned tasks'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;


