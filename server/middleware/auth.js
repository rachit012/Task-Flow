const { verifyAccessToken } = require('../utils/jwtUtils');
const User = require('../models/User');
const Project = require('../models/Project');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to check project access
const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user._id;

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (project.owner.equals(userId)) {
      req.project = project;
      req.userRole = 'owner';
      return next();
    }

    // Check if user is team member
    const teamMember = project.team.find(member => 
      member.user.equals(userId)
    );

    if (teamMember) {
      req.project = project;
      req.userRole = teamMember.role;
      return next();
    }

    // Check if project is public
    if (project.isPublic) {
      req.project = project;
      req.userRole = 'viewer';
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this project'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking project access'
    });
  }
};

// Middleware to require project owner
const requireProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user._id;

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (!project.owner.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Project owner access required'
      });
    }

    req.project = project;
    req.userRole = 'owner';
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking project ownership'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireProjectAccess,
  requireProjectOwner
};
