import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as any).Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const learnerApi = {
  getAll: () => api.get('/learners/'),
  getById: (id: string) => api.get(`/learners/${id}/`),
  getTree: (id: string) => api.get(`/learners/${id}/tree/`),
  getPathway: (id: string) => api.get(`/learners/${id}/pathway/`),
  getArtifacts: (id: string) => api.get(`/learners/${id}/artifacts/`),
  getPortfolioPdf: (id: string) => api.get(`/learners/${id}/portfolio-pdf/`),
};

export const artifactApi = {
  getAll: () => api.get('/artifacts/'),
  getById: (id: string) => api.get(`/artifacts/${id}/`),
  create: (data: any) => api.post('/artifacts/', data),
  uploadMedia: (id: string, formData: FormData) => 
    api.post(`/artifacts/${id}/upload-media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const dashboardApi = {
  getKpis: () => api.get('/dashboard/kpis/'),
  getTrends: () => api.get('/dashboard/trends/'),
  getImpactBrief: () => api.get('/dashboard/impact-brief/'),
};

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/token/`, credentials),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.resolve();
  },
  refreshToken: (refresh: string) => 
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/token/refresh/`, { refresh }),
};
