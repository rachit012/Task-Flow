import { useEffect, useState } from 'react'
import { useTask } from '../context/TaskContext'
import { useProject } from '../context/ProjectContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUser, FiCalendar, FiTag, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'

const Tasks = () => {
  const { tasks, loading, error, getTasks, createTask, deleteTask, updateTaskStatus } = useTask()
  const { projects } = useProject()
  const [retryCount, setRetryCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState('list') 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignedTo: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    estimatedHours: '',
    tags: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log('Fetching tasks...')
        const result = await getTasks()
        console.log('Tasks fetch result:', result)
        if (!result.success) {
          console.error('Failed to fetch tasks:', result.error)
        }
      } catch (err) {
        console.error('Error in fetchTasks:', err)
      }
    }

    fetchTasks()
  }, [getTasks, retryCount])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Task title is required'
    } else if (formData.title.length < 3) {
      errors.title = 'Task title must be at least 3 characters'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters'
    }
    
    if (!formData.project) {
      errors.project = 'Project is required'
    }
    
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required'
    }
    
    
    if (formData.assignedTo && formData.assignedTo.trim() === '') {
      errors.assignedTo = 'Please select a valid user or leave empty'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const taskData = {
        ...formData,
        
        assignedTo: formData.assignedTo || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : 0
      }
      
      const result = await createTask(taskData)
      
      if (result.success) {
        setShowCreateModal(false)
        setFormData({
          title: '',
          description: '',
          project: '',
          assignedTo: '',
          priority: 'medium',
          status: 'todo',
          dueDate: '',
          estimatedHours: '',
          tags: ''
        })
        setFormErrors({})
        toast.success('Task created successfully!')
      } else {
        toast.error(result.error || 'Failed to create task')
      }
    } catch (err) {
      console.error('Error creating task:', err)
      const errorMessage = err.response?.data?.message || 'Failed to create task. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await deleteTask(taskId)
      } catch (err) {
        console.error('Error deleting task:', err)
      }
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus)
    } catch (err) {
      console.error('Error updating task status:', err)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'secondary'
      case 'in-progress': return 'warning'
      case 'done': return 'success'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo': return 'To Do'
      case 'in-progress': return 'In Progress'
      case 'done': return 'Done'
      default: return status
    }
  }

  const filterTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-md"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Create New Task
          </button>
        </div>

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load tasks</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={handleRetry}
              className="btn btn-primary btn-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your tasks and track progress</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}

            >
              Kanban
            </button>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-md"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Create New Task
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        
        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`badge badge-${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      {task.project && (
                        <div className="flex items-center">
                          <FiTag className="w-4 h-4 mr-1" />
                          <span>{projects.find(p => p._id === task.project)?.name || 'Unknown Project'}</span>
                        </div>
                      )}
                      {task.assignedTo && (
                        <div className="flex items-center">
                          <FiUser className="w-4 h-4 mr-1" />
                          <span>{task.assignedTo}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {task.estimatedHours > 0 && (
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1" />
                          <span>{task.estimatedHours}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="select select-sm"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first task</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary btn-md"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Create New Task
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['todo', 'in-progress', 'done'].map((status) => (
            <div key={status} className="kanban-column">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getStatusLabel(status)}
                </h3>
                <span className="badge badge-gray">
                  {filterTasksByStatus(status).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {filterTasksByStatus(status).map((task) => (
                  <div key={task._id} className="kanban-task">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <span className={`badge badge-${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {task.project && (
                          <span>{projects.find(p => p._id === task.project)?.name || 'Unknown'}</span>
                        )}
                        {task.dueDate && (
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCreateModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Task
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`input ${formErrors.title ? 'border-red-500' : ''}`}
                            placeholder="Enter task title"
                          />
                          {formErrors.title && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className={`textarea ${formErrors.description ? 'border-red-500' : ''}`}
                            placeholder="Describe the task"
                          />
                          {formErrors.description && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project *
                            </label>
                            <select
                              name="project"
                              value={formData.project}
                              onChange={handleInputChange}
                              className={`select ${formErrors.project ? 'border-red-500' : ''}`}
                            >
                              <option value="">Select Project</option>
                              {projects.map((project) => (
                                <option key={project._id} value={project._id}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                            {formErrors.project && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.project}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              name="priority"
                              value={formData.priority}
                              onChange={handleInputChange}
                              className="select"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Due Date *
                            </label>
                            <input
                              type="date"
                              name="dueDate"
                              value={formData.dueDate}
                              onChange={handleInputChange}
                              className={`input ${formErrors.dueDate ? 'border-red-500' : ''}`}
                            />
                            {formErrors.dueDate && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.dueDate}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estimated Hours
                            </label>
                            <input
                              type="number"
                              name="estimatedHours"
                              value={formData.estimatedHours}
                              onChange={handleInputChange}
                              className="input"
                              placeholder="0"
                              min="0"
                              step="0.5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="tag1, tag2, tag3"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-md w-full sm:w-auto sm:ml-3"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating...</span>
                      </>
                    ) : (
                      'Create Task'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-outline btn-md w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks

