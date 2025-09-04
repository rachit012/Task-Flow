import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
import LoadingSpinner from '../components/LoadingSpinner'

const ProjectDetail = () => {
  const { id } = useParams()
  const { currentProject, loading, getProject } = useProject()

  useEffect(() => {
    if (id) {
      getProject(id)
    }
  }, [id, getProject])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
          <p className="text-gray-600 mt-1">{currentProject.description}</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-secondary btn-md">Edit Project</button>
          <button className="btn btn-primary btn-md">Add Task</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Project Information</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm text-gray-900 capitalize">{currentProject.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <p className="text-sm text-gray-900 capitalize">{currentProject.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(currentProject.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(currentProject.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Team Members</h2>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src={`https://ui-avatars.com/api/?name=${currentProject.owner?.name}&background=6366f1&color=fff`}
                  alt={currentProject.owner?.name}
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{currentProject.owner?.name}</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
              </div>
              {currentProject.team?.map((member) => (
                <div key={member.user._id} className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${member.user.name}&background=6366f1&color=fff`}
                    alt={member.user.name}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Project Tasks</h2>
        </div>
        <div className="card-content">
          <p className="text-gray-500">Task management interface will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail


