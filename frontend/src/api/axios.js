import axios from 'axios'

// Use the environment variable, or fallback to localhost for local development
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

console.log("API Base URL configured as:", baseURL);

const API = axios.create({
  baseURL: baseURL,
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API