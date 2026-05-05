import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Helper to get the root URL (removing /api if present, for media files)
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const AUTH_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

type ApiPayload = object;
type ApiParams = object;
type ApiErrorBody = {
  error?: { message?: string };
  detail?: string;
};

const withSelectedSchool = <T extends object>(payload: T = {} as T): T & { school_id?: string } => {
  if (typeof localStorage === 'undefined') {
    return payload;
  }
  const selectedSchoolId = localStorage.getItem('selected_school_id');
  if (!selectedSchoolId) {
    return payload;
  }
  return { ...payload, school_id: selectedSchoolId };
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('access_token'); // sessionStorage — not localStorage
    const selectedSchoolId = localStorage.getItem('selected_school_id'); // not a secret
    if (token) {
      if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (selectedSchoolId && config.headers) {
      config.headers['X-School-ID'] = selectedSchoolId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and normalize errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle Token Refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem('refresh_token'); // sessionStorage
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          sessionStorage.setItem('access_token', access); // sessionStorage

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Normalize Error Response
    if (error.response?.data) {
        const data = error.response.data as ApiErrorBody;
        // Check for new backend error format
        if (data.error && data.error.message) {
             error.message = data.error.message;
        } else if (data.detail) {
             error.message = data.detail;
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
  create: (data: ApiPayload) => api.post('/api/artifacts/', data),
  uploadMedia: (id: string, formData: FormData) => 
    api.post(`/api/artifacts/${id}/upload-media/`, formData),
};

export const studentApi = {
  // Get complete dashboard data for authenticated student
  getDashboard: () => api.get('/api/student/dashboard/'),
  // Get pathway learning content
  getPathwayLearning: (enrollmentId: string) => api.get(`/api/pathway-learning/${enrollmentId}/learn/`),
  // Get all artifacts for the authenticated student
  getArtifacts: () => api.get('/api/student/artifacts/'),
  // Get modules for student's enrolled pathways
  getMyModules: () => api.get('/api/student/my-modules/'),
  // Upload a new artifact for teacher review
  uploadArtifact: (data: {
    title: string;
    reflection?: string;
    files?: File[];
    module_id?: string;
    task_id?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.reflection) formData.append('reflection', data.reflection);
    if (data.module_id) formData.append('module_id', data.module_id);
    if (data.task_id) formData.append('task_id', data.task_id);
    (data.files || []).forEach(f => formData.append('files', f));

    return api.post('/api/student/upload-artifact/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const dashboardApi = {
  getKpis: () => api.get('/api/dashboard/kpis/'),
  getTrends: () => api.get('/api/dashboard/trends/'),
  getImpactBrief: () => api.get('/api/dashboard/impact-brief/'),
};

// Child management API (for parents)
export const childApi = {
  // List all children for the authenticated parent
  getAll: () => api.get('/api/children/'),
  
  // Get detailed information about a specific child
  getById: (id: string) => api.get(`/api/children/${id}/`),
  
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
    pathway_ids?: string[];
  }) => api.post('/api/children/', data),
  
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
  }>) => api.patch(`/api/children/${id}/`, data),
  
  // Delete a child
  delete: (id: string) => api.delete(`/api/children/${id}/`),
  
  // Get complete dashboard data for a child
  getDashboard: (id: string) => api.get(`/api/children/${id}/dashboard/`),
  
  // Get all artifacts for a child
  getArtifacts: (id: string) => api.get(`/api/children/${id}/artifacts/`),
  
  // Get pathway score and recommendations for a child
  getPathway: (id: string) => api.get(`/api/children/${id}/pathway/`),
  
  // Get summary of all children
  getSummary: () => api.get('/api/children/summary/'),
};

  // Teacher API
export const teacherApi = {
  // Dashboard
  getDashboard: () => api.get('/api/teacher/sessions/dashboard/', { params: withSelectedSchool({}) }),
  
  // Sessions
  getSessions: () => api.get('/api/teacher/sessions/', { params: withSelectedSchool({}) }),
  getTodaySessions: () => api.get('/api/teacher/sessions/today/', { params: withSelectedSchool({}) }),
  getUpcomingSessions: () => api.get('/api/teacher/sessions/upcoming/', { params: withSelectedSchool({}) }),
  getSession: (id: string) => api.get(`/api/teacher/sessions/${id}/`, { params: withSelectedSchool({}) }),
  createSession: (data: {
    module: string;
    date: string;
    start_time?: string;
    end_time?: string;
    notes?: string;
    status?: string;
  }) => api.post('/api/teacher/sessions/', withSelectedSchool(data)),
  updateSession: (id: string, data: ApiPayload) => api.patch(`/api/teacher/sessions/${id}/`, withSelectedSchool(data)),
  deleteSession: (id: string) => api.delete(`/api/teacher/sessions/${id}/`, { params: withSelectedSchool({}) }),
  startSession: (id: string) => api.post(`/api/teacher/sessions/${id}/start/`, withSelectedSchool({})),
  completeSession: (id: string) => api.post(`/api/teacher/sessions/${id}/complete/`, withSelectedSchool({})),
  listModules: () => api.get('/api/teacher/sessions/list-modules/', { params: withSelectedSchool({}) }),
  listPathways: () => api.get('/api/teacher/sessions/list-pathways/', { params: withSelectedSchool({}) }),

  
  // Attendance
  markAttendance: (sessionId: string, attendance: Array<{
    learner_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>) => api.post(`/api/teacher/sessions/${sessionId}/mark-attendance/`, withSelectedSchool({ attendance })),

  getAttendance: (sessionId: string) =>
    api.get(`/api/teacher/sessions/${sessionId}/`, { params: withSelectedSchool({}) }),

  getAttendanceSessions: (params?: { marked?: boolean; date_from?: string; date_to?: string }) =>
    api.get('/api/teacher/sessions/', { params: withSelectedSchool(params || {}) }),

  
  // Quick Artifacts
  getPendingArtifacts: () => api.get('/api/teacher/quick-artifacts/pending/', { params: withSelectedSchool({}) }),
  captureArtifact: (data: {
    learner: string;
    title: string;
    reflection?: string;
    files?: File[];
    links?: Array<{ url: string; label?: string }>;
    module?: string;
    session?: string;
    metrics?: string[];
  }) => {
    const formData = new FormData();
    const schoolId = localStorage.getItem('selected_school_id');
    formData.append('learner', data.learner);
    formData.append('title', data.title);
    if (data.reflection) formData.append('reflection', data.reflection);
    if (data.module)     formData.append('module', data.module);
    if (data.session)    formData.append('session', data.session);
    if (schoolId)        formData.append('school_id', schoolId);

    // Attach each file under the "files" key
    (data.files || []).forEach(f => formData.append('files', f));

    // Links as JSON string
    formData.append('links', JSON.stringify(data.links || []));
    formData.append('metrics', JSON.stringify(data.metrics || []));

    return api.post('/api/teacher/quick-artifacts/capture/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Student Artifact Submissions Review
  getStudentSubmissions: () => api.get('/api/teacher/quick-artifacts/student-submissions/', { params: withSelectedSchool({}) }),
  reviewArtifact: (id: string, data: { action: 'approve' | 'reject', rejection_reason?: string }) =>
    api.post(`/api/teacher/quick-artifacts/${id}/review/`, withSelectedSchool(data)),

  // Badge Management
  badges: {
    getAll: () => api.get('/api/teacher/badges/', { params: withSelectedSchool({}) }),
    award: (data: {
      learner: string;
      badge_name: string;
      description?: string;
      module?: string;
    }) => api.post('/api/teacher/badges/award/', withSelectedSchool(data)),
    awardBadge: (data: {
      learner_id: string;
      badge_template_id: string;
      evidence_ids: string[];
      verification_ref?: string;
    } | {
      learner_id: string;
      badge_name: string;
      description?: string;
      module_id?: string;
    }) => {
      if ('badge_template_id' in data) {
        return api.post('/api/teacher/badges/award/', withSelectedSchool({
          learner: data.learner_id,
          learner_id: data.learner_id,
          badge_template_id: data.badge_template_id,
          evidence_ids: data.evidence_ids,
          ...(data.verification_ref ? { verification_ref: data.verification_ref } : {}),
        }));
      }
      const payload = {
        learner: data.learner_id,
        badge_name: data.badge_name,
        ...(data.description ? { description: data.description } : {}),
        ...(data.module_id ? { module: data.module_id } : {}),
      };
      return api.post('/api/teacher/badges/award/', withSelectedSchool(payload));
    },
    getLearnerBadges: (learnerId: string) => api.get(`/api/teacher/badges/learner/${learnerId}/`, { params: withSelectedSchool({}) }),
    getAvailable: () => api.get('/api/teacher/badges/available/', { params: withSelectedSchool({}) }),
  },

  // Student Management
  students: {
    getAll: (params?: { search?: string; course_id?: string }) =>
      api.get('/api/teacher/students/', { params: withSelectedSchool(params || {}) }),
    getById: (id: string) => api.get(`/api/teacher/students/${id}/`, { params: withSelectedSchool({}) }),
    create: (data: ApiPayload) => api.post('/api/teacher/students/', withSelectedSchool(data)),
    getSchools: () => api.get('/api/teacher/students/schools/', { params: withSelectedSchool({}) }),
    enroll: (data: {
      learner_id: string;
      course_id: string;
      level_id?: string;
    }) => api.post('/api/teacher/students/enroll/', withSelectedSchool(data)),
  },

  // Credential Management
  credentials: {
    getAll: () => api.get('/api/teacher/credentials/', { params: withSelectedSchool({}) }),
    award: (data: {
      learner_id: string;
      microcredential_template_id: string;
      evidence_ids: string[];
      badge_record_ids?: string[];
    } | {
      learner: string;
      name: string;
      issuer?: string;
      issued_at?: string;
    }) => {
      if ('microcredential_template_id' in data) {
        return api.post('/api/teacher/credentials/award/', withSelectedSchool({
          learner: data.learner_id,
          learner_id: data.learner_id,
          microcredential_template_id: data.microcredential_template_id,
          evidence_ids: data.evidence_ids,
          ...(data.badge_record_ids ? { badge_record_ids: data.badge_record_ids } : {}),
        }));
      }
      return api.post('/api/teacher/credentials/award/', withSelectedSchool(data));
    },
    getLearnerCredentials: (learnerId: string) =>
      api.get(`/api/teacher/credentials/learner/${learnerId}/`, { params: withSelectedSchool({}) }),
  },

  // Tasks
  tasks: {
    getAll: (params?: { status?: string; priority?: string }) =>
      api.get('/api/teacher/tasks/', { params: params || {} }),
    getById: (id: string) => api.get(`/api/teacher/tasks/${id}/`),
    create: (data: {
      title: string;
      description?: string;
      due_date?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'todo' | 'in_progress' | 'done';
    }) => api.post('/api/teacher/tasks/', data),
    update: (id: string, data: ApiPayload) => api.patch(`/api/teacher/tasks/${id}/`, data),
    delete: (id: string) => api.delete(`/api/teacher/tasks/${id}/`),
    toggle: (id: string) => api.post(`/api/teacher/tasks/${id}/toggle/`),
    getSummary: () => api.get('/api/teacher/tasks/summary/'),
  },
};


export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    axios.post(`${AUTH_BASE_URL}/auth/token/`, credentials),
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    school_code?: string;
  }) =>
    axios.post(`${AUTH_BASE_URL}/auth/register/`, data),
  logout: (refreshToken: string) =>
    axios.post(`${AUTH_BASE_URL}/auth/logout/`, { refresh: refreshToken }),
  refreshToken: (refresh: string) => 
    axios.post(`${AUTH_BASE_URL}/auth/token/refresh/`, { refresh }),
  getProfile: () => 
    api.get(`${AUTH_BASE_URL}/user/profile/`),
  updateProfile: (data: { first_name?: string; last_name?: string; email?: string }) =>
    api.patch(`${AUTH_BASE_URL}/user/profile/`, data),
  getDashboard: () =>
    api.get(`${AUTH_BASE_URL}/user/dashboard/`),
  
  // Avatar management
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`${AUTH_BASE_URL}/user/avatar/`, formData);
  },
  deleteAvatar: () =>
    api.delete(`${AUTH_BASE_URL}/user/avatar/`),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post(`${AUTH_BASE_URL}/user/change-password/`, data),
};

// Course API
export const courseApi = {
  // List all courses (optionally filter by domain)
  getAll: () => 
    api.get('/api/courses/'),
  
  // Get course by ID with levels
  getById: (id: string) => api.get(`/api/courses/${id}/`),
  
  // Get courses available for a specific learner
  getForLearner: (learnerId: string) => api.get(`/api/courses/for-learner/${learnerId}/`),
  
  // Get all levels for a course
  getLevels: (courseId: string) => api.get(`/api/courses/${courseId}/levels/`),
  
  // Admin: Create course with levels
  create: (data: {
    name: string;
    description?: string;
    levels?: Array<{
      name: string;
      description?: string;
      learning_outcomes?: string[];
      required_modules_count?: number;
      required_artifacts_count?: number;
      required_assessment_score?: number;
    }>;
  }) => api.post('/api/courses/', data),
  
  // Admin: Update course
  update: (id: string, data: ApiPayload) => api.patch(`/api/courses/${id}/`, data),
  
  // Admin: Delete course
  delete: (id: string) => api.delete(`/api/courses/${id}/`),
};

// Module (Micro-credential) API
export const moduleApi = {
  getAll: (courseId?: string) => api.get('/api/modules/', { params: { course: courseId } }),
  getById: (id: string) => api.get(`/api/modules/${id}/`),
  create: (data: ApiPayload) => api.post('/api/modules/', data),
  update: (id: string, data: ApiPayload) => api.patch(`/api/modules/${id}/`, data),
  delete: (id: string) => api.delete(`/api/modules/${id}/`),
  uploadMedia: (moduleId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/modules/${moduleId}/upload-media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteMedia: (moduleId: string, mediaId: string) => 
    api.delete(`/api/modules/${moduleId}/delete-media/${mediaId}/`),
};

// Career API
export const careerApi = {
  getAll: (courseId?: string) => api.get('/api/careers/', { params: { course: courseId } }),
  create: (data: ApiPayload) => api.post('/api/careers/', data),
  update: (id: string, data: ApiPayload) => api.patch(`/api/careers/${id}/`, data),
  delete: (id: string) => api.delete(`/api/careers/${id}/`),
};

// Enrollment API
export const enrollmentApi = {
  // Get all enrollments (filtered by role)
  getAll: () => api.get('/api/enrollments/'),
  
  // Get enrollment by ID with full details
  getById: (id: string) => api.get(`/api/enrollments/${id}/`),
  
  // Get progress for an enrollment
  getProgress: (id: string) => api.get(`/api/enrollments/${id}/progress/`),
  
  // Enroll a learner in a course
  enroll: (learnerId: string, courseId: string) => 
    api.post('/api/enrollments/', { learner: learnerId, course: courseId }),
  
  // Unenroll a learner
  unenroll: (id: string) => api.delete(`/api/enrollments/${id}/`),
};

// Progress API (for teachers)
export const progressApi = {
  // Get progress record by ID
  getById: (id: string) => api.get(`/api/progress/${id}/`),
  
  // Update progress (modules, artifacts, score)
  updateProgress: (id: string, data: {
    modules_completed?: number;
    completed_module_ids?: string[];
    artifacts_submitted?: number;
    assessment_score?: number;
    teacher_confirmed?: boolean;
  }) => api.post(`/api/progress/${id}/update_progress/`, data),
  
  // Teacher confirms level completion
  confirmCompletion: (id: string) => api.post(`/api/progress/${id}/confirm_completion/`),
};

// Achievement API
export const achievementApi = {
  // Get all achievements (for current user/learner)
  getAll: () => api.get('/api/achievements/'),
  
  // Get achievements for a specific learner
  getForLearner: (learnerId: string) => api.get(`/api/achievements/for-learner/${learnerId}/`),
};

// Activity API
export const activityApi = {
  // Get all activities
  getAll: (params?: { status?: string; date_from?: string; date_to?: string }) =>
    api.get('/api/activities/', { params }),

  // Get activity by ID
  getById: (id: string) => api.get(`/api/activities/${id}/`),

  // Get upcoming activities
  getUpcoming: () => api.get('/api/activities/upcoming/'),

  // Create activity
  create: (data: {
    name: string;
    description?: string;
    date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    course?: string;
  }) => api.post('/api/activities/', data),

  // Update activity
  update: (id: string, data: Partial<{
    name: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    status: string;
    course: string;
  }>) => api.patch(`/api/activities/${id}/`, data),

  // Delete activity
  delete: (id: string) => api.delete(`/api/activities/${id}/`),

  // Upload media
  uploadMedia: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/activities/${activityId}/upload-media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete media
  deleteMedia: (activityId: string, mediaId: string) =>
    api.delete(`/api/activities/${activityId}/delete-media/${mediaId}/`),
};

// Admin API (admin-only endpoints)
export const adminApi = {
  // User Management
  users: {
    getAll: (params?: ApiParams) => api.get('/api/admin/users/', { params }),
    getById: (id: string) => api.get(`/api/admin/users/${id}/`),
    create: (data: ApiPayload) => api.post('/api/admin/users/', data),
    update: (id: string, data: ApiPayload) => api.patch(`/api/admin/users/${id}/`, data),
    delete: (id: string, params?: { permanent?: boolean }) => api.delete(`/api/admin/users/${id}/`, { params }),
    bulkImport: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/api/admin/users/bulk-import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    export: (params?: ApiParams) => api.get('/api/admin/users/export/', { 
      params,
      responseType: 'blob'
    }),
    stats: () => api.get('/api/admin/users/stats/'),
  },

  // School/Tenant Management
  tenants: {
    getAll: (params?: ApiParams) => api.get('/api/admin/tenants/', { params }),
    getById: (id: string) => api.get(`/api/admin/tenants/${id}/`),
    create: (data: ApiPayload) => api.post('/api/admin/tenants/', data),
    update: (id: string, data: ApiPayload) => api.put(`/api/admin/tenants/${id}/`, data),
    delete: (id: string) => api.delete(`/api/admin/tenants/${id}/`),
    stats: (id: string) => api.get(`/api/admin/tenants/${id}/stats/`),
  },

  // Analytics
  analytics: {
    overview:  () => api.get('/api/admin/analytics/overview/'),
    users:     (params?: ApiParams) => api.get('/api/admin/analytics/users/', { params }),
    enrollments: (params?: ApiParams) => api.get('/api/admin/analytics/enrollments/', { params }),
    dashboard: (params?: { days?: number }) => api.get('/api/admin/analytics/dashboard/', { params }),
  },

  // Monitoring
  monitor: {
    sessions: {
      list:    (params?: ApiParams) => api.get('/api/admin/monitor/sessions/', { params }),
      summary: (params?: ApiParams) => api.get('/api/admin/monitor/sessions/summary/', { params }),
    },
    tasks: {
      list:    (params?: ApiParams) => api.get('/api/admin/monitor/tasks/', { params }),
      summary: (params?: ApiParams) => api.get('/api/admin/monitor/tasks/summary/', { params }),
    },
    attendance: {
      list:    (params?: ApiParams) => api.get('/api/admin/monitor/attendance/', { params }),
      summary: (params?: ApiParams) => api.get('/api/admin/monitor/attendance/summary/', { params }),
    },
  },
};

export const schoolApi = {
  stats: () => api.get('/api/school/dashboard/stats/'),
  analytics: {
      get: () => api.get('/api/school/dashboard/analytics/'),
  },

  badges: {
      getAll: () => api.get('/api/school/dashboard/badges/'),
  },

  artifacts: {
      getAll: () => api.get('/api/school/dashboard/artifacts/'),
  },

  progress: {
      getAll: () => api.get('/api/school/dashboard/progress/'),
  },

  students: {
    getAll: (params?: ApiParams) => api.get('/api/school/students/', { params }),
    getById: (id: string) => api.get(`/api/school/students/${id}/`),
    create: (data: ApiPayload) => api.post('/api/school/students/', data),
    update: (id: string, data: ApiPayload) => api.put(`/api/school/students/${id}/`, data),
    delete: (id: string) => api.delete(`/api/school/students/${id}/`),
  },

  teachers: {
    getAll: (params?: ApiParams) => api.get('/api/school/teachers/', { params }),
    getById: (id: string) => api.get(`/api/school/teachers/${id}/`),
    create: (data: ApiPayload) => api.post('/api/school/teachers/', data),
    update: (id: string, data: ApiPayload) => api.put(`/api/school/teachers/${id}/`, data),
    delete: (id: string) => api.delete(`/api/school/teachers/${id}/`),
  },

  pathways: {
    getAll: (params?: ApiParams) => api.get('/api/school/pathways/', { params }),
    getById: (id: string) => api.get(`/api/school/pathways/${id}/`),
  },

  classes: {
    getAll: (params?: ApiParams) => api.get('/api/school/classes/', { params }),
  },

  sessions: {
    getAll: () => api.get('/api/school/dashboard/sessions/'),
  },
};

export const cmsApi = {
  pathways: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/pathways/', { params }),
    getById: (id: string) => api.get(`/api/cms/pathways/${id}/`),
    create: (data: unknown) => api.post('/api/cms/pathways/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/pathways/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/pathways/${id}/`),
  },
  tracks: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/tracks/', { params }),
    getById: (id: string) => api.get(`/api/cms/tracks/${id}/`),
    create: (data: unknown) => api.post('/api/cms/tracks/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/tracks/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/tracks/${id}/`),
  },
  programs: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/programs/', { params }),
    getById: (id: string) => api.get(`/api/cms/programs/${id}/`),
    create: (data: unknown) => api.post('/api/cms/programs/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/programs/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/programs/${id}/`),
  },
  modules: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/modules/', { params }),
    getById: (id: string) => api.get(`/api/cms/modules/${id}/`),
    create: (data: unknown) => api.post('/api/cms/modules/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/modules/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/modules/${id}/`),
    submitForReview: (id: string) => api.post(`/api/cms/modules/${id}/submit-for-review/`),
    approveReview: (id: string) => api.post(`/api/cms/modules/${id}/approve-review/`),
    publish: (id: string) => api.post(`/api/cms/modules/${id}/publish/`),
    peerReviewQueue: () => api.get('/api/cms/modules/peer-review-queue/'),
  },
  units: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/units/', { params }),
    getById: (id: string) => api.get(`/api/cms/units/${id}/`),
    create: (data: unknown) => api.post('/api/cms/units/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/units/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/units/${id}/`),
  },
  lessons: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/lessons/', { params }),
    getById: (id: string) => api.get(`/api/cms/lessons/${id}/`),
    create: (data: unknown) => api.post('/api/cms/lessons/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/lessons/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/lessons/${id}/`),
  },
  tasks: {
    getAll: (params?: Record<string, string>) => api.get('/api/cms/tasks/', { params }),
    getById: (id: string) => api.get(`/api/cms/tasks/${id}/`),
    create: (data: unknown) => api.post('/api/cms/tasks/', data),
    update: (id: string, data: unknown) => api.patch(`/api/cms/tasks/${id}/`, data),
    delete: (id: string) => api.delete(`/api/cms/tasks/${id}/`),
  },
};

export const teacherDashboardApi = {
  getCohortProgress: () =>
    api.get('/api/teacher/dashboard/cohort-progress/', { params: withSelectedSchool({}) }),
  getBadgeReadiness: () =>
    api.get('/api/teacher/dashboard/badge-readiness/', { params: withSelectedSchool({}) }),
  getMicrocredentialReadiness: () =>
    api.get('/api/teacher/dashboard/microcredential-readiness/', { params: withSelectedSchool({}) }),
  getInterventions: () =>
    api.get('/api/teacher/dashboard/interventions/', { params: withSelectedSchool({}) }),
  getCertificationPipeline: () =>
    api.get('/api/teacher/dashboard/certification-pipeline/', { params: withSelectedSchool({}) }),
  getLearnerDualView: (learnerId: string) =>
    api.get(`/api/teacher/dashboard/${learnerId}/dual-view/`, { params: withSelectedSchool({}) }),
};

export const learnerDashboardApi = {
  getGrowth: () => api.get("/api/learner/dashboard/growth/"),
  getModuleProgress: () => api.get("/api/learner/dashboard/module-progress/"),
  getEvidence: () => api.get("/api/learner/dashboard/evidence/"),
  getCertifications: () => api.get("/api/learner/dashboard/certifications/"),
};

export const parentDashboardApi = {
  getChildren: () => api.get("/api/parent/dashboard/children/"),
  getGrowth: (learnerId: string) => api.get(`/api/parent/dashboard/${learnerId}/growth/`),
  getRecognition: (learnerId: string) => api.get(`/api/parent/dashboard/${learnerId}/recognition/`),
  getArtifacts: (learnerId: string) => api.get(`/api/parent/dashboard/${learnerId}/artifacts/`),
  getSessions: (learnerId: string) => api.get(`/api/parent/dashboard/${learnerId}/sessions/`),
};

export const programManagerApi = {
  getPathwayDemand: () => api.get("/api/program-manager/dashboard/pathway-demand/"),
  getCompletionRates: () => api.get("/api/program-manager/dashboard/completion-rates/"),
  getBadgeDistribution: () => api.get("/api/program-manager/dashboard/badge-distribution/"),
  getMicrocredentialIssuance: () => api.get("/api/program-manager/dashboard/microcredential-issuance/"),
  getCertificationRates: () => api.get("/api/program-manager/dashboard/certification-rates/"),
  getLevelDistribution: () => api.get("/api/program-manager/dashboard/level-distribution/"),
  getAgeBands: () => api.get("/api/program-manager/dashboard/age-bands/"),
};
