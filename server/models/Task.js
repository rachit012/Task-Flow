const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dependencies: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by'],
      default: 'blocks'
    }
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

 
taskSchema.virtual('statusColor').get(function() {
  const colors = {
    'todo': 'gray',
    'in-progress': 'blue',
    'done': 'green'
  };
  return colors[this.status] || 'gray';
});

 
taskSchema.virtual('priorityColor').get(function() {
  const colors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  };
  return colors[this.priority] || 'gray';
});

 
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

 
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.isCompleted) return false;
  return new Date() > this.dueDate;
});

 
taskSchema.virtual('timeSpent').get(function() {
  return this.actualHours || 0;
});

 
taskSchema.virtual('timeRemaining').get(function() {
  return Math.max(0, (this.estimatedHours || 0) - (this.actualHours || 0));
});

 
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ isCompleted: 1 });

 
taskSchema.pre('save', function(next) {
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'done';
  } else if (!this.isCompleted && this.completedAt) {
    this.completedAt = null;
  }
  next();
});

 
taskSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text,
    createdAt: new Date()
  });
  return this.save();
};

 
taskSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  return this.save();
};

 
taskSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'done') {
    this.isCompleted = true;
    this.completedAt = new Date();
  } else {
    this.isCompleted = false;
    this.completedAt = null;
  }
  return this.save();
};

// Instance method to log time
taskSchema.methods.logTime = function(hours) {
  this.actualHours = (this.actualHours || 0) + hours;
  return this.save();
};

// Static method to get tasks by project
taskSchema.statics.findByProject = function(projectId) {
  return this.find({ project: projectId })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.user', 'name email')
    .sort({ order: 1, createdAt: -1 });
};

// Static method to get tasks by user
taskSchema.statics.findByUser = function(userId) {
  return this.find({ assignedTo: userId })
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1, priority: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    isCompleted: false
  }).populate('assignedTo', 'name email')
    .populate('project', 'name');
};

// Static method to get tasks by status
taskSchema.statics.findByStatus = function(status) {
  return this.find({ status: status })
    .populate('assignedTo', 'name email')
    .populate('project', 'name')
    .sort({ order: 1, createdAt: -1 });
};

module.exports = mongoose.model('Task', taskSchema);


