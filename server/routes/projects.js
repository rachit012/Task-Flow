const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticateToken, requireProjectAccess, requireProjectOwner } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateProject = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// @route   GET /api/projects
// @desc    Get all projects for the authenticated user
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { status, priority, search } = req.query;
  
  // Build filter object
  let filter = {
    $or: [
      { owner: req.user._id },
      { 'team.user': req.user._id }
    ]
  };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('team.user', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      projects,
      count: projects.length
    }
  });
}));

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', validateProject, authenticateToken, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    startDate,
    endDate,
    priority,
    tags,
    budget,
    isPublic
  } = req.body;

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    });
  }

  // Create project
  const project = new Project({
    name,
    description,
    startDate,
    endDate,
    priority: priority || 'medium',
    tags: tags || [],
    budget: budget || { amount: 0, currency: 'USD' },
    isPublic: isPublic || false,
    owner: req.user._id
  });

  await project.save();

  // Populate owner and team data
  await project.populate('owner', 'name email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: {
      project
    }
  });
}));

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private (project owner or team member)
router.get('/:id', authenticateToken, requireProjectAccess, asyncHandler(async (req, res) => {
  await req.project.populate('owner', 'name email');
  await req.project.populate('team.user', 'name email');

  res.json({
    success: true,
    data: {
      project: req.project
    }
  });
}));

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (project owner only)
router.put('/:id', validateProject, authenticateToken, requireProjectOwner, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    startDate,
    endDate,
    status,
    priority,
    tags,
    budget,
    isPublic
  } = req.body;

  // Validate dates
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    });
  }

  // Update project
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      startDate,
      endDate,
      status,
      priority,
      tags,
      budget,
      isPublic
    },
    { new: true, runValidators: true }
      ).populate('owner', 'name email')
    .populate('team.user', 'name email');

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: {
      project: updatedProject
    }
  });
}));

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (project owner only)
router.delete('/:id', authenticateToken, requireProjectOwner, asyncHandler(async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// @route   POST /api/projects/:id/team
// @desc    Add team member to project
// @access  Private (project owner only)
router.post('/:id/team', authenticateToken, requireProjectOwner, asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is already a team member
  const isAlreadyMember = req.project.team.some(member => 
    member.user.toString() === userId
  );

  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a team member'
    });
  }

  // Add team member
  await req.project.addTeamMember(userId, role);

  // Populate team data
  await req.project.populate('team.user', 'name email');

  res.json({
    success: true,
    message: 'Team member added successfully',
    data: {
      project: req.project
    }
  });
}));

// @route   DELETE /api/projects/:id/team/:userId
// @desc    Remove team member from project
// @access  Private (project owner only)
router.delete('/:id/team/:userId', authenticateToken, requireProjectOwner, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user is a team member
  const isTeamMember = req.project.team.some(member => 
    member.user.toString() === userId
  );

  if (!isTeamMember) {
    return res.status(400).json({
      success: false,
      message: 'User is not a team member'
    });
  }

  // Remove team member
  await req.project.removeTeamMember(userId);

  res.json({
    success: true,
    message: 'Team member removed successfully'
  });
}));

// @route   GET /api/projects/:id/stats
// @desc    Get project statistics
// @access  Private (project owner or team member)
router.get('/:id/stats', authenticateToken, requireProjectAccess, asyncHandler(async (req, res) => {
  const Task = require('../models/Task');

  // Get task statistics
  const totalTasks = await Task.countDocuments({ project: req.params.id });
  const completedTasks = await Task.countDocuments({ 
    project: req.params.id, 
    isCompleted: true 
  });
  const overdueTasks = await Task.countDocuments({
    project: req.params.id,
    dueDate: { $lt: new Date() },
    isCompleted: false
  });

  // Calculate progress
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get tasks by status
  const tasksByStatus = await Task.aggregate([
    { $match: { project: req.project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Get tasks by priority
  const tasksByPriority = await Task.aggregate([
    { $match: { project: req.project._id } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        progress,
        tasksByStatus,
        tasksByPriority
      }
    }
  });
}));

module.exports = router;


