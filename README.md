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

MERN

**Environment Setup**
   
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

**Run the application**
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend (from client directory, in new terminal)
   npm run dev
   ```
**Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

