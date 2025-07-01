// API Configuration
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api/v1',
    ENVIRONMENT: 'development'
  },
  production: {
    API_BASE_URL: 'https://marketing-analytics-api.onrender.com/api/v1',
    ENVIRONMENT: 'production'
  }
}

// Determine current environment
const environment = process.env.NODE_ENV || 'development'

// Export the config for the current environment
export default config[environment]

// You can also use environment variables to override these settings:
// VITE_API_BASE_URL will override the API_BASE_URL if set
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || config[environment].API_BASE_URL
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || config[environment].ENVIRONMENT 