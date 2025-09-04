const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { authenticateToken, requireProjectAccess } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Task title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('project')
    .notEmpty()
    .isMongoId()
    .withMessage('Project is required and must be a valid project ID'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Status must be todo, in-progress, or done'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user must be a valid user ID')
];

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    project, 
    status, 
    priority, 
    assignedTo, 
    search,
    overdue,
    dueDate 
  } = req.query;
  
  // Build filter object
  let filter = {};

  // Filter by project access
  if (project) {
    // Check if user has access to this project
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = projectDoc.owner.toString() === req.user._id.toString() ||
                     projectDoc.team.some(member => member.user.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    filter.project = project;
  } else {
    // Get all projects user has access to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);
    filter.project = { $in: projectIds };
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.isCompleted = false;
  }

  if (dueDate) {
    const date = new Date(dueDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    filter.dueDate = {
      $gte: date,
      $lt: nextDay
    };
  }

  const tasks = await Task.find(filter)
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ order: 1, createdAt: -1 });

  res.json({
    success: true,
    data: {
      tasks,
      count: tasks.length
    }
  });
}));

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', validateTask, authenticateToken, asyncHandler(async (req, res) => {
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
    title,
    description,
    project,
    assignedTo,
    status,
    priority,
    dueDate,
    estimatedHours,
    tags
  } = req.body;

  // Check if project exists and user has access
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const hasAccess = projectDoc.owner.toString() === req.user._id.toString() ||
                   projectDoc.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this project'
    });
  }

  // Get the highest order number for this project and status
  const maxOrder = await Task.findOne({ project, status: status || 'todo' })
    .sort({ order: -1 })
    .select('order');
  
  const order = (maxOrder?.order || 0) + 1;

  // Create task
  const task = new Task({
    title,
    description,
    project,
    assignedTo: assignedTo || null, // Handle null/empty values properly
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate,
    estimatedHours: estimatedHours || 0,
    tags: tags || [],
    createdBy: req.user._id,
    order
  });

  await task.save();

  // Populate related data
  await task.populate('project', 'name');
  await task.populate('assignedTo', 'name email');
  await task.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: {
      task
    }
  });
}));

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private (project member)
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.user', 'name email');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project._id);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  res.json({
    success: true,
    data: {
      task
    }
  });
}));

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (project member)
router.put('/:id', validateTask, authenticateToken, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  const {
    title,
    description,
    assignedTo,
    status,
    priority,
    dueDate,
    estimatedHours,
    tags,
    isCompleted
  } = req.body;

  // Update task
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      assignedTo,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags,
      isCompleted
    },
    { new: true, runValidators: true }
  ).populate('project', 'name')
   .populate('assignedTo', 'name email')
   .populate('createdBy', 'name email');

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: {
      task: updatedTask
    }
  });
}));

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (project member)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// @route   PUT /api/tasks/:id/status
// @desc    Update task status (for drag and drop)
// @access  Private (project member)
router.put('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { status, order } = req.body;

  if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required'
    });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  // Update task status and order
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      status,
      order: order || 0,
      isCompleted: status === 'done'
    },
    { new: true }
  ).populate('project', 'name')
   .populate('assignedTo', 'name email')
   .populate('createdBy', 'name email');

  res.json({
    success: true,
    message: 'Task status updated successfully',
    data: {
      task: updatedTask
    }
  });
}));

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private (project member)
router.post('/:id/comments', authenticateToken, asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required'
    });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  // Add comment
  await task.addComment(req.user._id, text);

  // Populate comment data
  await task.populate('comments.user', 'name email');

  res.json({
    success: true,
    message: 'Comment added successfully',
    data: {
      task
    }
  });
}));

// @route   PUT /api/tasks/:id/time
// @desc    Log time to task
// @access  Private (project member)
router.put('/:id/time', authenticateToken, asyncHandler(async (req, res) => {
  const { hours } = req.body;

  if (!hours || hours <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid hours are required'
    });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to the project
  const project = await Project.findById(task.project);
  const hasAccess = project.owner.toString() === req.user._id.toString() ||
                   project.team.some(member => member.user.toString() === req.user._id.toString());

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this task'
    });
  }

  // Log time
  await task.logTime(hours);

  res.json({
    success: true,
    message: 'Time logged successfully',
    data: {
      task
    }
  });
}));

module.exports = router;

