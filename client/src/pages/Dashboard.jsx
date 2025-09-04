import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'
import { useTask } from '../context/TaskContext'
import { userAPI } from '../utils/api'
import { FiCheckCircle, FiClock, FiAlertTriangle, FiCalendar, FiPlus, FiRefreshCw, FiUsers, FiFolder } from 'react-icons/fi'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const { projects, getProjects } = useProject()
  const { tasks, getTasks } = useTask()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await userAPI.getDashboard()
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const refreshAllData = useCallback(async () => {
    try {
      setRefreshing(true)
      await Promise.all([
        fetchDashboardData(),
        getProjects(),
        getTasks()
      ])
      toast.success('Dashboard refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh data:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }, [fetchDashboardData, getProjects, getTasks])

  useEffect(() => {
    const loadProjectsAndDashboard = async () => {
      await getProjects();
      fetchDashboardData();
    };
    loadProjectsAndDashboard();
  }, [getProjects, fetchDashboardData]);

  useEffect(() => {
    if (projects.length > 0 || tasks.length > 0) {
      fetchDashboardData()
    }
  }, [projects.length, tasks.length, fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-2">Failed to load dashboard data</p>
        <button 
          onClick={refreshAllData}
          className="btn btn-primary btn-md"
          disabled={refreshing}
        >
          {refreshing ? <FiRefreshCw className="animate-spin" /> : 'Retry'}
        </button>
      </div>
    )
  }

  const { stats, upcomingTasks, tasksByStatus, tasksByPriority, projects: userProjects } = dashboardData

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}! 
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your projects and tasks today.
            </p>
          </div>
          <button 
            onClick={refreshAllData}
            className="btn btn-outline btn-md"
            disabled={refreshing}
          >
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiClock className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiCalendar className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Rate</h2>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
          <span className="ml-4 text-sm font-medium text-gray-900">
            {stats.completionRate}%
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <div key={project._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <FiUsers className="mr-1" />
                    {project.team?.length || 0} members
                  </span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiFolder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link to="/projects" className="btn btn-primary btn-sm">
              Create Your First Project
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
          <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        {upcomingTasks && upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.slice(0, 5).map((task) => (
              <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.project?.name || 'No Project'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No upcoming tasks</p>
            <Link to="/tasks" className="btn btn-primary btn-sm">
              Create Your First Task
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h2>
          {tasksByStatus && tasksByStatus.length > 0 ? (
            <div className="space-y-3">
              {tasksByStatus.map((status) => (
                <div key={status._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{status._id}</span>
                  <span className="text-sm font-medium text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks found</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
          {tasksByPriority && tasksByPriority.length > 0 ? (
            <div className="space-y-3">
              {tasksByPriority.map((priority) => (
                <div key={priority._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{priority._id}</span>
                  <span className="text-sm font-medium text-gray-900">{priority.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No tasks found</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/projects" className="btn btn-primary btn-md">
            <FiPlus className="mr-2" />
            Create New Project
          </Link>
          <Link to="/tasks" className="btn btn-secondary btn-md">
            <FiPlus className="mr-2" />
            Add New Task
          </Link>
          <Link to="/projects" className="btn btn-outline btn-md">
            <FiFolder className="mr-2" />
            View All Projects
          </Link>
          <Link to="/tasks" className="btn btn-outline btn-md">
            <FiCheckCircle className="mr-2" />
            View All Tasks
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

