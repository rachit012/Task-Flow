const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@taskflow.com',
    password: 'password123',
    role: 'admin',
    // avatar field removed
  },
  {
    name: 'John Doe',
    email: 'john@taskflow.com',
    password: 'password123',
    role: 'user',
    // avatar field removed
  },
  {
    name: 'Jane Smith',
    email: 'jane@taskflow.com',
    password: 'password123',
    role: 'user',
    // avatar field removed
  },
  {
    name: 'Mike Johnson',
    email: 'mike@taskflow.com',
    password: 'password123',
    role: 'user',
    // avatar field removed
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@taskflow.com',
    password: 'password123',
    role: 'user',
    // avatar field removed
  }
];

const sampleProjects = [
  {
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX principles and improved functionality.',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-03-15'),
    tags: ['design', 'frontend', 'ui/ux'],
    budget: { amount: 15000, currency: 'USD' },
    isPublic: false
  },
  {
    name: 'Mobile App Development',
    description: 'Develop a cross-platform mobile application for iOS and Android using React Native.',
    status: 'active',
    priority: 'urgent',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-01'),
    tags: ['mobile', 'react-native', 'cross-platform'],
    budget: { amount: 25000, currency: 'USD' },
    isPublic: false
  },
  {
    name: 'Database Migration',
    description: 'Migrate existing database to a new cloud-based solution with improved performance and scalability.',
    status: 'on-hold',
    priority: 'medium',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-02-20'),
    tags: ['database', 'migration', 'cloud'],
    budget: { amount: 8000, currency: 'USD' },
    isPublic: false
  },
  {
    name: 'Marketing Campaign',
    description: 'Launch a comprehensive marketing campaign across multiple channels to increase brand awareness.',
    status: 'active',
    priority: 'medium',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-04-10'),
    tags: ['marketing', 'campaign', 'branding'],
    budget: { amount: 12000, currency: 'USD' },
    isPublic: true
  },
  {
    name: 'Security Audit',
    description: 'Conduct a comprehensive security audit of all systems and implement necessary security measures.',
    status: 'active',
    priority: 'high',
    startDate: new Date('2024-01-25'),
    endDate: new Date('2024-03-25'),
    tags: ['security', 'audit', 'compliance'],
    budget: { amount: 18000, currency: 'USD' },
    isPublic: false
  }
];

const sampleTasks = [
  // Website Redesign Tasks
  {
    title: 'Design Homepage Layout',
    description: 'Create wireframes and mockups for the new homepage design',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2024-01-25'),
    estimatedHours: 8,
    actualHours: 10,
    tags: ['design', 'wireframes']
  },
  {
    title: 'Implement Responsive Design',
    description: 'Code the responsive design for all screen sizes',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-02-10'),
    estimatedHours: 16,
    actualHours: 8,
    tags: ['frontend', 'responsive']
  },
  {
    title: 'Optimize Page Speed',
    description: 'Optimize images, CSS, and JavaScript for faster loading',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-02-20'),
    estimatedHours: 6,
    actualHours: 0,
    tags: ['performance', 'optimization']
  },
  {
    title: 'Content Migration',
    description: 'Migrate existing content to the new design structure',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-02-28'),
    estimatedHours: 12,
    actualHours: 0,
    tags: ['content', 'migration']
  },

  // Mobile App Development Tasks
  {
    title: 'Setup React Native Project',
    description: 'Initialize the React Native project with proper configuration',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2024-02-05'),
    estimatedHours: 4,
    actualHours: 3,
    tags: ['setup', 'react-native']
  },
  {
    title: 'Design App Screens',
    description: 'Create UI designs for all app screens',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-02-15'),
    estimatedHours: 20,
    actualHours: 12,
    tags: ['design', 'ui']
  },
  {
    title: 'Implement Navigation',
    description: 'Set up navigation between different app screens',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-02-25'),
    estimatedHours: 8,
    actualHours: 0,
    tags: ['navigation', 'routing']
  },
  {
    title: 'API Integration',
    description: 'Integrate backend APIs with the mobile app',
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2024-03-10'),
    estimatedHours: 16,
    actualHours: 0,
    tags: ['api', 'integration']
  },

  // Database Migration Tasks
  {
    title: 'Backup Current Database',
    description: 'Create complete backup of existing database',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2024-01-22'),
    estimatedHours: 2,
    actualHours: 1.5,
    tags: ['backup', 'database']
  },
  {
    title: 'Setup New Database',
    description: 'Configure and setup the new cloud database',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-01-30'),
    estimatedHours: 6,
    actualHours: 4,
    tags: ['setup', 'cloud']
  },
  {
    title: 'Data Migration Scripts',
    description: 'Write scripts to migrate data from old to new database',
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2024-02-10'),
    estimatedHours: 12,
    actualHours: 0,
    tags: ['migration', 'scripts']
  },

  // Marketing Campaign Tasks
  {
    title: 'Create Campaign Strategy',
    description: 'Develop comprehensive marketing campaign strategy',
    status: 'done',
    priority: 'high',
    dueDate: new Date('2024-02-15'),
    estimatedHours: 8,
    actualHours: 10,
    tags: ['strategy', 'planning']
  },
  {
    title: 'Design Marketing Materials',
    description: 'Create banners, social media posts, and other marketing materials',
    status: 'in-progress',
    priority: 'medium',
    dueDate: new Date('2024-02-25'),
    estimatedHours: 16,
    actualHours: 8,
    tags: ['design', 'materials']
  },
  {
    title: 'Launch Social Media Campaign',
    description: 'Execute social media marketing campaign across platforms',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-03-01'),
    estimatedHours: 12,
    actualHours: 0,
    tags: ['social-media', 'launch']
  },

  // Security Audit Tasks
  {
    title: 'Vulnerability Assessment',
    description: 'Conduct comprehensive vulnerability assessment of all systems',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date('2024-02-05'),
    estimatedHours: 20,
    actualHours: 12,
    tags: ['security', 'assessment']
  },
  {
    title: 'Penetration Testing',
    description: 'Perform penetration testing on critical systems',
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2024-02-20'),
    estimatedHours: 24,
    actualHours: 0,
    tags: ['security', 'testing']
  },
  {
    title: 'Security Policy Review',
    description: 'Review and update security policies and procedures',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2024-03-10'),
    estimatedHours: 8,
    actualHours: 0,
    tags: ['policy', 'review']
  }
];

// Seed function
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.name} (${user.email})`);
    }

    // Create projects
    const createdProjects = [];
    for (let i = 0; i < sampleProjects.length; i++) {
      const projectData = sampleProjects[i];
      const project = new Project({
        ...projectData,
        owner: createdUsers[0]._id, // Admin owns all projects
        team: [
          {
            user: createdUsers[1]._id,
            role: 'lead',
            joinedAt: new Date()
          },
          {
            user: createdUsers[2]._id,
            role: 'member',
            joinedAt: new Date()
          }
        ]
      });
      await project.save();
      createdProjects.push(project);
      console.log(`📁 Created project: ${project.name}`);
    }

    // Create tasks
    let taskIndex = 0;
    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      const tasksForProject = sampleTasks.slice(taskIndex, taskIndex + 4);
      
      for (let j = 0; j < tasksForProject.length; j++) {
        const taskData = tasksForProject[j];
        const task = new Task({
          ...taskData,
          project: project._id,
          assignedTo: createdUsers[1 + j % 3]._id, // Assign to different users
          createdBy: createdUsers[0]._id, // Admin creates all tasks
          order: j + 1
        });
        await task.save();
        console.log(`✅ Created task: ${task.title} for project: ${project.name}`);
      }
      taskIndex += 4;
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📁 Projects: ${createdProjects.length}`);
    console.log(`   ✅ Tasks: ${sampleTasks.length}`);
    
    console.log('\n🔑 Test Accounts:');
    console.log('   Admin: admin@taskflow.com / password123');
    console.log('   User: john@taskflow.com / password123');
    console.log('   User: jane@taskflow.com / password123');
    console.log('   User: mike@taskflow.com / password123');
    console.log('   User: sarah@taskflow.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed function
seedData();


