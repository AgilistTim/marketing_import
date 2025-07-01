import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import './App.css'

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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  process.env.NODE_ENV === 'production' 
    ? '/api/v1' // Same origin in Docker container
    : 'http://localhost:5000/api/v1' // Development
)

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

// Authentication Context
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// API utility functions
export const api = {
  async request(endpoint, options = {}) {
    // Use mock API in production mode
    if (process.env.NODE_ENV === 'production') {
      return await mockApiRequest(endpoint, options)
    }
    
    // Use real API in development mode
    const token = localStorage.getItem('access_token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshToken}`,
            },
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            localStorage.setItem('access_token', refreshData.access_token)
            
            // Retry original request with new token
            config.headers.Authorization = `Bearer ${refreshData.access_token}`
            return fetch(`${API_BASE_URL}${endpoint}`, config)
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
        }
      }
      
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
      return
    }

    return response
  },

  async get(endpoint) {
    const response = await this.request(endpoint)
    return response?.json()
  },

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response?.json()
  },

  async put(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response?.json()
  },

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    })
    return response?.json()
  },
}

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // Verify token and get user info
      api.get('/auth/profile')
        .then(data => {
          if (data?.user) {
            setUser(data.user)
          } else {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="projects/:projectId/credentials" element={<CredentialsPage />} />
              <Route path="projects/:projectId/data-sources" element={<DataSourcesPage />} />
              <Route path="projects/:projectId/webhooks" element={<WebhooksPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

