import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import './App.css'
import axios from 'axios'

// Import components
import LoginPage from './components/auth/LoginPage'
import RegisterPage from './components/auth/RegisterPage'
import Dashboard from './components/dashboard/Dashboard'
import ProjectsPage from './components/projects/ProjectsPage'
import ProjectDetailPage from './components/projects/ProjectDetailPage'
import CredentialsPage from './components/credentials/CredentialsPage'
import DataSourcesPage from './components/data-sources/DataSourcesPage'
import WebhooksPage from './components/webhooks/WebhooksPage'
import SettingsPage from './components/settings/SettingsPage'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// API configuration - simplified for Docker deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Mock API responses for demo purposes
const mockApiResponses = {
  '/auth/login': {
    access_token: 'mock_access_token_12345',
    refresh_token: 'mock_refresh_token_12345',
    user: {
      id: 'mock_user_id',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    }
  },
  '/users/mock_user_id/stats': {
    total_projects: 1,
    active_credentials: 1,
    data_sources: 0,
    webhooks: 0
  },
  '/projects': {
    projects: [
      {
        id: 'mock_project_id',
        name: 'Test Marketing Project',
        description: 'Demo project for testing',
        created_at: '2025-07-01T00:00:00Z',
        active_credentials_count: 1,
        active_data_sources_count: 0
      }
    ],
    total: 1,
    page: 1,
    per_page: 10
  }
}

// Mock API function
async function mockApiRequest(endpoint, options = {}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Check if we have a mock response for this endpoint
  const mockResponse = mockApiResponses[endpoint]
  if (mockResponse) {
    return {
      ok: true,
      status: 200,
      json: async () => mockResponse
    }
  }
  
  // Default success response for unknown endpoints
  return {
    ok: true,
    status: 200,
    json: async () => ({ message: 'Mock API response', data: {} })
  }
}

// Auth context
export const AuthContext = createContext(null)

// API utility functions
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Auth functions
export const auth = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  },

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error' }
    }
  },

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      return response.ok
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }
}

// Auth hook for components to use
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      
      // Verify token is still valid
      api.get('/auth/profile')
        .then(data => {
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      if (response && response.access_token) {
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        return { success: true, user: response.user }
      } else {
        return { success: false, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: error.message || 'Network error' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response && response.access_token) {
        localStorage.setItem('token', response.access_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        setUser(response.user)
        return { success: true, user: response.user }
      } else {
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: error.message || 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

            {/* Protected routes */}
            <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/data-sources" element={<DataSourcesPage />} />
              <Route path="projects/:projectId/credentials" element={<CredentialsPage />} />
              <Route path="projects/:projectId/credentials/new" element={<CredentialsPage />} />
              <Route path="projects/:projectId/webhooks" element={<WebhooksPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App

