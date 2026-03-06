import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    const data    = error.response?.data || {};
    const message = data.message || 'Something went wrong';
    // Build a rich error that preserves all fields from the server response
    const err = new Error(message);
    err.status           = error.response?.status;
    err.code             = data.code;
    err.previousName     = data.previousName;
    err.previousArchived = data.previousArchived;
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (e) => api.post('/auth/forgot-password', { email: e }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (d) => api.put('/auth/update-password', d),
  updatePreferences: (d) => api.put('/auth/preferences', d)
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (d) => api.post('/students', d),
  update: (id, d) => api.put(`/students/${id}`, d),
  delete: (id) => api.delete(`/students/${id}`),
  getAttendance: (id, params) => api.get(`/students/${id}/attendance`, { params }),
  getMarks: (id) => api.get(`/students/${id}/marks`),
  toggleBookmark: (newsId) => api.post(`/students/bookmark/${newsId}`),
  bookmark: (_sid, newsId) => api.post(`/students/bookmark/${newsId}`) // alias used in StudentNews
};

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teacherAPI = {
  getAll: () => api.get('/teachers'),
  getById: (id) => api.get(`/teachers/${id}`),
  update:  (id, d) => api.put(`/teachers/${id}`, d)
};

// ─── Subjects ─────────────────────────────────────────────────────────────────
export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (d) => api.post('/subjects', d),
  delete: (id) => api.delete(`/subjects/${id}`)
};

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classAPI = {
  getAll: () => api.get('/classes'),
  create: (d) => api.post('/classes', d),
  update: (id, d) => api.put(`/classes/${id}`, d),
  sync:   ()       => api.post('/classes/sync')
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  mark: (d) => api.post('/attendance/mark', d),
  getClass: (params) => api.get('/attendance/class', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params })
};

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignmentAPI = {
  getAll:  (params) => api.get('/assignments', { params }),
  create:  (fd) => api.post('/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:  (id) => api.delete(`/assignments/${id}`),
  submit:       (fd)  => api.post('/assignments/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSubmissions: (id)  => api.get(`/assignments/${id}/submissions`)
};

// ─── Marks ────────────────────────────────────────────────────────────────────
export const marksAPI = {
  add: (d) => api.post('/marks', d),
  getClass: (params) => api.get('/marks', { params })
};

// ─── News ─────────────────────────────────────────────────────────────────────
export const newsAPI = {
  getAll:       (params) => api.get('/news', { params }),
  create:       (d)      => api.post('/news', d),
  update:       (id, d)  => api.put(`/news/${id}`, d),
  delete:       (id)     => api.delete(`/news/${id}`),
  fetchFromAPI: (category = 'all') => api.post('/news/fetch', { category })
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcementAPI = {
  getAll: () => api.get('/announcements'),
  create: (d) => api.post('/announcements', d),
  update: (id, d) => api.put(`/announcements/${id}`, d),
  delete: (id) => api.delete(`/announcements/${id}`)
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentAPI = {
  getAll: (params) => api.get('/documents', { params }),
  create: (fd) => api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, d) => api.put(`/documents/${id}`, d)
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getAttendanceReport: (params) => api.get('/analytics/attendance', { params })
};

// ─── Chatbot ──────────────────────────────────────────────────────────────────
export const chatbotAPI = {
  chat:      (d) => api.post('/chatbot', d),
  translate: (text, title, summary, content) => api.post('/chatbot/translate', { text, title, summary, content })
};

// ─── Study Materials ──────────────────────────────────────────────────────────
export const materialAPI = {
  getAll:    (params) => api.get('/materials', { params }),
  upload:    (fd) => api.post('/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:    (id) => api.delete(`/materials/${id}`),
  download:  (id) => `/api/materials/download/${id}`
};

export default api;
