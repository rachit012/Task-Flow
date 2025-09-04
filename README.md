# TaskFlow - Project Management Application

A complete MERN stack project management web application with real-time task tracking, Kanban boards, and team collaboration features.

## Features

- **User Authentication**: JWT-based auth with refresh tokens
- **Project Management**: Create, read, update, delete projects with team assignment
- **Task Management**: CRUD tasks with drag-and-drop Kanban boards
- **Dashboard**: Real-time analytics and task statistics with refresh functionality
- **Profile Management**: Edit profile, change password, view assigned tasks and projects
- **Role-based Access**: Admin and user roles
- **Responsive Design**: Works on mobile and desktop
- **Real-time Updates**: Dashboard refreshes automatically when projects/tasks change

## Tech Stack

### Frontend
- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls
- React Context API for state management
- React Hook Form for form handling
- React Hot Toast for notifications
- React Icons for icons

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ORM
- JWT authentication with bcrypt
- Nodemon for development
- Express Validator for input validation

## Project Structure

```
TaskFlow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the server directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   ```
   
   Create `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run the application**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend (from client directory, in new terminal)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Seed Data

The application includes sample data for testing:

- **Admin User**: admin@taskflow.com / password123
- **Regular User**: user@taskflow.com / password123
- Sample projects and tasks

## Recent Updates

### Dashboard Enhancements
- **Real-time Updates**: Dashboard automatically refreshes when projects or tasks are created/updated
- **Recent Projects Section**: Shows user's recent projects with status and team information
- **Upcoming Tasks**: Displays tasks due in the next 7 days
- **Task Statistics**: Visual representation of tasks by status and priority
- **Quick Actions**: Direct links to create projects and tasks
- **Refresh Button**: Manual refresh functionality with loading states

### Profile Management
- **Edit Profile**: Inline form to update name and email
- **Password Change**: Secure password change with current password verification
- **My Projects**: Shows projects assigned to the user
- **My Tasks**: Displays tasks assigned to the user with priority and status
- **Form Validation**: Client-side validation with error messages

### Bug Fixes
- **Fixed Infinite Re-render**: Resolved "Maximum update depth exceeded" warning by implementing `useCallback` in context providers
- **Fixed ObjectId Errors**: Resolved "Cast to ObjectId failed" errors when creating tasks with empty assignedTo field
- **Fixed JWT Refresh Issues**: Fixed token refresh mechanism to use correct API base URL and prevent logout on refresh
- **Improved Error Handling**: Better error messages and retry functionality
- **Enhanced UI**: Better loading states, empty states, and user feedback

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/tasks` - Get user's assigned tasks

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

