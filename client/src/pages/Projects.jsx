import { useEffect, useState } from 'react'
import { useProject } from '../context/ProjectContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiCalendar, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'

const Projects = () => {
  const { projects, loading, error, getProjects, createProject, deleteProject } = useProject()
  const [retryCount, setRetryCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    tags: '',
    budget: '',
    isPublic: false
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...')
        const result = await getProjects()
        console.log('Projects fetch result:', result)
        if (!result.success) {
          console.error('Failed to fetch projects:', result.error)
        }
      } catch (err) {
        console.error('Error in fetchProjects:', err)
      }
    }

    fetchProjects()
  }, [getProjects, retryCount])

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
    
    if (!formData.name.trim()) {
      errors.name = 'Project name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'Project name must be at least 3 characters'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters'
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    }
    
    if (!formData.endDate) {
      errors.endDate = 'End date is required'
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const projectData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        budget: formData.budget ? { amount: parseFloat(formData.budget), currency: 'USD' } : { amount: 0, currency: 'USD' }
      }
      
      const result = await createProject(projectData)
      
      if (result.success) {
        setShowCreateModal(false)
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          priority: 'medium',
          tags: '',
          budget: '',
          isPublic: false
        })
        setFormErrors({})
        toast.success('Project created successfully!')
      } else {
        toast.error(result.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      const errorMessage = err.response?.data?.message || 'Failed to create project. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId)
      } catch (err) {
        console.error('Error deleting project:', err)
      }
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
      case 'active': return 'success'
      case 'completed': return 'primary'
      case 'on-hold': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-md"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Create New Project
          </button>
        </div>

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load projects</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your projects and collaborate with your team</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-md"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Create New Project
        </button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="card hover:shadow-lg transition-shadow">
              <div className="card-header">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="card-title">{project.name}</h3>
                    <p className="card-description line-clamp-2">{project.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project._id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge badge-${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`badge badge-${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FiUsers className="w-4 h-4 mr-2" />
                    <span>{project.team?.length + 1 || 1} members</span>
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    <span>
                      {project.startDate && new Date(project.startDate).toLocaleDateString()} - 
                      {project.endDate && new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex items-center">
                      <FiTag className="w-4 h-4 mr-2" />
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="badge badge-gray text-xs">
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{project.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first project</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-md"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create New Project
            </button>
          </div>
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
                        Create New Project
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`input ${formErrors.name ? 'border-red-500' : ''}`}
                            placeholder="Enter project name"
                          />
                          {formErrors.name && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
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
                            placeholder="Describe your project"
                          />
                          {formErrors.description && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className={`input ${formErrors.startDate ? 'border-red-500' : ''}`}
                            />
                            {formErrors.startDate && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date *
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              className={`input ${formErrors.endDate ? 'border-red-500' : ''}`}
                            />
                            {formErrors.endDate && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Budget (USD)
                            </label>
                            <input
                              type="number"
                              name="budget"
                              value={formData.budget}
                              onChange={handleInputChange}
                              className="input"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
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

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Make project public
                          </label>
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
                      'Create Project'
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

export default Projects

