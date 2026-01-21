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
  getAll: () => api.get('/api/learners/'),
  getById: (id: string) => api.get(`/api/learners/${id}/`),
  getTree: (id: string) => api.get(`/api/learners/${id}/tree/`),
  getPathway: (id: string) => api.get(`/api/learners/${id}/pathway/`),
  getArtifacts: (id: string) => api.get(`/api/learners/${id}/artifacts/`),
  getPortfolioPdf: (id: string) => api.get(`/api/learners/${id}/portfolio-pdf/`),
};

export const artifactApi = {
  getAll: () => api.get('/api/artifacts/'),
  getById: (id: string) => api.get(`/api/artifacts/${id}/`),
  create: (data: any) => api.post('/api/artifacts/', data),
  uploadMedia: (id: string, formData: FormData) => 
    api.post(`/api/artifacts/${id}/upload-media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const dashboardApi = {
  getKpis: () => api.get('/api/dashboard/kpis/'),
  getTrends: () => api.get('/api/dashboard/trends/'),
  getImpactBrief: () => api.get('/api/dashboard/impact-brief/'),
};

// Child management API (for parents)
export const childApi = {
  // List all children for the authenticated parent
  getAll: () => api.get('/children/'),
  
  // Get detailed information about a specific child
  getById: (id: string) => api.get(`/children/${id}/`),
  
  // Add a new child
  create: (data: {
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    current_school?: string;
    current_class?: string;
    username: string;
    password: string;
    password_confirm: string;
    consent_media?: boolean;
    equity_flag?: boolean;
    joined_at?: string;
  }) => api.post('/children/', data),
  
  // Update child information
  update: (id: string, data: Partial<{
    first_name: string;
    last_name: string;
    date_of_birth: string;
    current_school: string;
    current_class: string;
    consent_media: boolean;
    equity_flag: boolean;
    joined_at: string;
    new_password: string;
    new_password_confirm: string;
  }>) => api.patch(`/children/${id}/`, data),
  
  // Delete a child
  delete: (id: string) => api.delete(`/children/${id}/`),
  
  // Get complete dashboard data for a child
  getDashboard: (id: string) => api.get(`/children/${id}/dashboard/`),
  
  // Get all artifacts for a child
  getArtifacts: (id: string) => api.get(`/children/${id}/artifacts/`),
  
  // Get pathway score and recommendations for a child
  getPathway: (id: string) => api.get(`/children/${id}/pathway/`),
  
  // Get summary of all children
  getSummary: () => api.get('/children/summary/'),
};

// Teacher API
export const teacherApi = {
  // Dashboard
  getDashboard: () => api.get('/teacher/sessions/dashboard/'),
  
  // Sessions
  getSessions: () => api.get('/teacher/sessions/'),
  getTodaySessions: () => api.get('/teacher/sessions/today/'),
  getUpcomingSessions: () => api.get('/teacher/sessions/upcoming/'),
  getSession: (id: string) => api.get(`/teacher/sessions/${id}/`),
  startSession: (id: string) => api.post(`/teacher/sessions/${id}/start/`),
  completeSession: (id: string) => api.post(`/teacher/sessions/${id}/complete/`),
  
  // Attendance
  markAttendance: (sessionId: string, attendance: Array<{
    learner_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>) => api.post(`/teacher/sessions/${sessionId}/mark-attendance/`, { attendance }),
  
  // Quick Artifacts
  getPendingArtifacts: () => api.get('/teacher/quick-artifacts/pending/'),
  captureArtifact: (data: {
    learner: string;
    title: string;
    reflection?: string;
    media_refs?: any[];
  }) => api.post('/teacher/quick-artifacts/', data),
};

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/token/`, credentials),
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    school_code?: string;
  }) =>
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/register/`, data),
  logout: (refreshToken: string) =>
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/logout/`, { refresh: refreshToken }),
  refreshToken: (refresh: string) => 
    axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/token/refresh/`, { refresh }),
  getProfile: () => 
    api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/profile/`),
  getDashboard: () =>
    api.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/dashboard/`),
};

// Course API
export const courseApi = {
  // List all courses (optionally filter by age)
  getAll: (params?: { domain?: string; age?: number }) => 
    api.get('/courses/', { params }),
  
  // Get course by ID with levels
  getById: (id: string) => api.get(`/courses/${id}/`),
  
  // Get courses available for a specific learner
  getForLearner: (learnerId: string) => api.get(`/courses/for-learner/${learnerId}/`),
  
  // Get all levels for a course
  getLevels: (courseId: string) => api.get(`/courses/${courseId}/levels/`),
  
  // Admin: Create course with levels
  create: (data: {
    name: string;
    description?: string;
    domain: string;
    min_age: number;
    max_age: number;
    levels?: Array<{
      name: string;
      description?: string;
      learning_outcomes?: string[];
      required_modules_count?: number;
      required_artifacts_count?: number;
      required_assessment_score?: number;
    }>;
  }) => api.post('/courses/', data),
  
  // Admin: Update course
  update: (id: string, data: any) => api.patch(`/courses/${id}/`, data),
  
  // Admin: Delete course
  delete: (id: string) => api.delete(`/courses/${id}/`),
};

// Enrollment API
export const enrollmentApi = {
  // Get all enrollments (filtered by role)
  getAll: () => api.get('/enrollments/'),
  
  // Get enrollment by ID with full details
  getById: (id: string) => api.get(`/enrollments/${id}/`),
  
  // Get progress for an enrollment
  getProgress: (id: string) => api.get(`/enrollments/${id}/progress/`),
  
  // Enroll a learner in a course
  enroll: (learnerId: string, courseId: string) => 
    api.post('/enrollments/', { learner: learnerId, course: courseId }),
  
  // Unenroll a learner
  unenroll: (id: string) => api.delete(`/enrollments/${id}/`),
};

// Progress API (for teachers)
export const progressApi = {
  // Get progress record by ID
  getById: (id: string) => api.get(`/progress/${id}/`),
  
  // Update progress (modules, artifacts, score)
  updateProgress: (id: string, data: {
    modules_completed?: number;
    artifacts_submitted?: number;
    assessment_score?: number;
    teacher_confirmed?: boolean;
  }) => api.post(`/progress/${id}/update_progress/`, data),
  
  // Teacher confirms level completion
  confirmCompletion: (id: string) => api.post(`/progress/${id}/confirm_completion/`),
};

// Achievement API
export const achievementApi = {
  // Get all achievements (for current user/learner)
  getAll: () => api.get('/achievements/'),
  
  // Get achievements for a specific learner
  getForLearner: (learnerId: string) => api.get(`/achievements/for-learner/${learnerId}/`),
};

