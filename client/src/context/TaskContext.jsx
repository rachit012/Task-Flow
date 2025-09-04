import { createContext, useContext, useReducer, useCallback } from 'react'
import { taskAPI } from '../utils/api'
import toast from 'react-hot-toast'

const TaskContext = createContext()

const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null
}

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'TASKS_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'TASKS_SUCCESS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null
      }
    case 'TASKS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'TASK_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'TASK_SUCCESS':
      return {
        ...state,
        currentTask: action.payload,
        loading: false,
        error: null
      }
    case 'TASK_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks]
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task._id === action.payload._id ? action.payload : task
        ),
        currentTask: state.currentTask?._id === action.payload._id 
          ? action.payload 
          : state.currentTask
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload),
        currentTask: state.currentTask?._id === action.payload 
          ? null 
          : state.currentTask
      }
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task._id === action.payload._id ? action.payload : task
        ),
        currentTask: state.currentTask?._id === action.payload._id 
          ? action.payload 
          : state.currentTask
      }
    case 'ADD_TASK_COMMENT':
      return {
        ...state,
        currentTask: state.currentTask?._id === action.payload.taskId
          ? {
              ...state.currentTask,
              comments: [...state.currentTask.comments, action.payload.comment]
            }
          : state.currentTask
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

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  
  const getTasks = useCallback(async (params = {}) => {
    dispatch({ type: 'TASKS_LOADING' })
    try {
      const response = await taskAPI.getAll(params)
      const tasks = response.data.data?.tasks || response.data.tasks || response.data || []
      dispatch({ type: 'TASKS_SUCCESS', payload: tasks })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load tasks'
      dispatch({ type: 'TASKS_FAILURE', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const getTask = useCallback(async (id) => {
    dispatch({ type: 'TASK_LOADING' })
    try {
      const response = await taskAPI.getById(id)
      dispatch({ type: 'TASK_SUCCESS', payload: response.data.data.task })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load task'
      dispatch({ type: 'TASK_FAILURE', payload: message })
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const createTask = useCallback(async (taskData) => {
    try {
      const response = await taskAPI.create(taskData)
      const newTask = response.data.data.task
      dispatch({ type: 'ADD_TASK', payload: newTask })
      toast.success('Task created successfully')
      return { success: true, task: newTask }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const updateTask = useCallback(async (id, taskData) => {
    try {
      const response = await taskAPI.update(id, taskData)
      const updatedTask = response.data.data.task
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      toast.success('Task updated successfully')
      return { success: true, task: updatedTask }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const deleteTask = useCallback(async (id) => {
    try {
      await taskAPI.delete(id)
      dispatch({ type: 'DELETE_TASK', payload: id })
      toast.success('Task deleted successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const updateTaskStatus = useCallback(async (id, status, order) => {
    try {
      const response = await taskAPI.updateStatus(id, status, order)
      const updatedTask = response.data.data.task
      dispatch({ type: 'UPDATE_TASK_STATUS', payload: updatedTask })
      return { success: true, task: updatedTask }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update task status'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const addTaskComment = useCallback(async (id, text) => {
    try {
      const response = await taskAPI.addComment(id, text)
      const comment = response.data.data.comment
      dispatch({ 
        type: 'ADD_TASK_COMMENT', 
        payload: { taskId: id, comment } 
      })
      toast.success('Comment added successfully')
      return { success: true, comment }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add comment'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const logTaskTime = useCallback(async (id, hours) => {
    try {
      const response = await taskAPI.logTime(id, hours)
      const updatedTask = response.data.data.task
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      toast.success('Time logged successfully')
      return { success: true, task: updatedTask }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to log time'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [])

  
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const value = {
    tasks: state.tasks,
    currentTask: state.currentTask,
    loading: state.loading,
    error: state.error,
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    addTaskComment,
    logTaskTime,
    clearError
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTask = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}

