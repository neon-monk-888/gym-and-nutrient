import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Profile API
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data)
}

// Meals API
export const mealsApi = {
  getByDate: (date) => api.get(`/meals?date=${date}`),
  create: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'file' && data[key]) {
        formData.append('file', data[key])
      } else if (key === 'items') {
        formData.append('items', JSON.stringify(data[key]))
      } else {
        formData.append(key, data[key])
      }
    })
    return api.post('/meals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (id) => api.delete(`/meals/${id}`),
  analysePhoto: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/meals/analyse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// Workouts API
export const workoutsApi = {
  getByRange: (range = 'week') => api.get(`/workouts?range=${range}`),
  getById: (id) => api.get(`/workouts/${id}`),
  create: (data) => api.post('/workouts', data),
  delete: (id) => api.delete(`/workouts/${id}`),
  getStats: (days = 30) => api.get(`/workouts/stats/summary?days=${days}`),
  getExerciseLibrary: () => api.get('/exercises/library')
}

// Weight API
export const weighInsApi = {
  get: (days = 30) => api.get(`/weigh-ins?days=${days}`),
  create: (data) => api.post('/weigh-ins', data)
}

// Dashboard API
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getWeeklySummary: (weekStart = null) => {
    const params = weekStart ? `?week_start=${weekStart}` : ''
    return api.get(`/weekly-summary${params}`)
  }
}

export default api