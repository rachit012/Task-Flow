import { createContext, useContext, useReducer, useCallback } from 'react'
import { projectAPI } from '../utils/api'
import toast from 'react-hot-toast'

const ProjectContext = createContext()

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null
}

const projectReducer = (state, action) => {
  switch (action.type) {
    case 'PROJECTS_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'PROJECTS_SUCCESS':
      return {
        ...state,
        projects: action.payload,
        loading: false,
        error: null
      }
    case 'PROJECTS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'PROJECT_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'PROJECT_SUCCESS':
      return {
        ...state,
        currentProject: action.payload,
        loading: false,
        error: null
      }
    case 'PROJECT_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [action.payload, ...state.projects]
      }
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => 
          project._id === action.payload._id ? action.payload : project
        ),
        currentProject: state.currentProject?._id === action.payload._id 
          ? action.payload 
          : state.currentProject
      }
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project._id !== action.payload),
        currentProject: state.currentProject?._id === action.payload 
          ? null 
          : state.currentProject
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState)

  
  const getProjects = useCallback(async (params = {}) => {
    dispatch({ type: 'PROJECTS_LOADING' })
    try {
      const response = await projectAPI.getAll(params)
      console.log('API Response:', response.data)
      
      
      const projects = response.data.data?.projects || response.data.projects || response.data || []
      dispatch({ type: 'PROJECTS_SUCCESS', payload: projects })
      return { success: true }
    } catch (error) {
      console.error('Project API Error:', error)
      const message = error.response?.data?.message || error.message || 'Failed to load projects'
      dispatch({ type: 'PROJECTS_FAILURE', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const getProject = useCallback(async (id) => {
    dispatch({ type: 'PROJECT_LOADING' })
    try {
      const response = await projectAPI.getById(id)
      dispatch({ type: 'PROJECT_SUCCESS', payload: response.data.data.project })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load project'
      dispatch({ type: 'PROJECT_FAILURE', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const createProject = useCallback(async (projectData) => {
    try {
      const response = await projectAPI.create(projectData)
      const newProject = response.data.data.project
      dispatch({ type: 'ADD_PROJECT', payload: newProject })
      toast.success('Project created successfully')
      return { success: true, project: newProject }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create project'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const updateProject = useCallback(async (id, projectData) => {
    try {
      const response = await projectAPI.update(id, projectData)
      const updatedProject = response.data.data.project
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject })
      toast.success('Project updated successfully')
      return { success: true, project: updatedProject }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update project'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const deleteProject = useCallback(async (id) => {
    try {
      await projectAPI.delete(id)
      dispatch({ type: 'DELETE_PROJECT', payload: id })
      toast.success('Project deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete project'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const getProjectStats = useCallback(async (id) => {
    try {
      const response = await projectAPI.getStats(id)
      return { success: true, stats: response.data.data.stats }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load project statistics'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const addTeamMember = useCallback(async (projectId, userId, role) => {
    try {
      const response = await projectAPI.addTeamMember(projectId, userId, role)
      const updatedProject = response.data.data.project
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject })
      toast.success('Team member added successfully')
      return { success: true, project: updatedProject }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add team member'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const removeTeamMember = useCallback(async (projectId, userId) => {
    try {
      await projectAPI.removeTeamMember(projectId, userId)
      
      if (state.currentProject?._id === projectId) {
        await getProject(projectId)
      }
      toast.success('Team member removed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove team member'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [state.currentProject, getProject])

  
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const value = {
    projects: state.projects,
    currentProject: state.currentProject,
    loading: state.loading,
    error: state.error,
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
    addTeamMember,
    removeTeamMember,
    clearError
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

