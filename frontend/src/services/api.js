import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const officerAPI = {
  getAll: (params = {}) => api.get('/officers/', { params }),
  getByRank: (rank, pageSize = 100) => api.get('/officers/', { 
    params: { rank, page_size: pageSize }
  }),
  getOne: (id) => api.get(`/officers/${id}/`),
};

export default api;