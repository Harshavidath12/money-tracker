// @ts-nocheck
import axios from 'axios'

export const API_BASE = 'http://localhost:8000/api'

axios.defaults.baseURL = API_BASE
axios.defaults.headers.common['Accept'] = 'application/json'

export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function removeToken() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

export function setAxiosAuth() {
  const token = getToken()
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
}

// Call this on every protected page to redirect to login if unauthenticated
export function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html'
    return false
  }
  setAxiosAuth()

  // Intercept 401 responses globally -> logout and redirect
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        removeToken()
        window.location.href = '/login.html'
      }
      return Promise.reject(error)
    }
  )
  return true
}

export { axios }
