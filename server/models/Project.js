const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'lead', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  budget: {
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

 
projectSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

 
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

 
projectSchema.virtual('statusColor').get(function() {
  const colors = {
    'active': 'green',
    'completed': 'blue',
    'on-hold': 'yellow',
    'cancelled': 'red'
  };
  return colors[this.status] || 'gray';
});

 
projectSchema.virtual('priorityColor').get(function() {
  const colors = {
    'low': 'gray',
    'medium': 'blue',
    'high': 'orange',
    'urgent': 'red'
  };
  return colors[this.priority] || 'gray';
});

 
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ 'team.user': 1 });
projectSchema.index({ endDate: 1 });

 
projectSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

 
projectSchema.methods.addTeamMember = function(userId, role = 'member') {
  const existingMember = this.team.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    existingMember.role = role;
  } else {
    this.team.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
  
  return this.save();
};

 
projectSchema.methods.removeTeamMember = function(userId) {
  this.team = this.team.filter(member => 
    member.user.toString() !== userId.toString()
  );
  return this.save();
};

 
projectSchema.methods.isTeamMember = function(userId) {
  return this.team.some(member => 
    member.user.toString() === userId.toString()
  );
};

 
projectSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

 
projectSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'team.user': userId }
    ]
    }).populate('owner', 'name email')
  .populate('team.user', 'name email');
};

 
projectSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
      .populate('owner', 'name email')
  .populate('team.user', 'name email');
};

module.exports = mongoose.model('Project', projectSchema);


