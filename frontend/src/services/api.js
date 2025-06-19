// import axios from 'axios';
// import { API_BASE_URL } from '@/utils/constants';
// import { authService } from './auth';

// class ApiService {
//   constructor() {
//     this.client = axios.create({
//       baseURL: API_BASE_URL,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     // Request interceptor
//     this.client.interceptors.request.use(
//       (config) => {
//         const token = authService.getToken();
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );

//     // Response interceptor
//     this.client.interceptors.response.use(
//       (response) => response.data,
//       (error) => {
//         if (error.response?.status === 401) {
//           authService.clearAuth();
//           window.location.href = '/login';
//         }
//         return Promise.reject(error.response?.data || error);
//       }
//     );
//   }

//   // Auth endpoints
//   async register(data) {
//     const response = await this.client.post('/auth/register', data);
//     authService.saveAuth(response.token, response.user);
//     return response;
//   }

//   async login(email, password) {
//     const response = await this.client.post('/auth/login', { email, password });
//     authService.saveAuth(response.token, response.user);
//     return response;
//   }

//   async verifyToken() {
//     return this.client.get('/auth/verify');
//   }

//   // Test management
//   async createTest(data) {
//     return this.client.post('/tests', data);
//   }

//   async getTests() {
//     return this.client.get('/tests');
//   }

//   async getTestDetails(testId) {
//     return this.client.get(`/tests/${testId}`);
//   }

//   async deleteTest(testId) {
//     return this.client.delete(`/tests/${testId}`);
//   }

//   // Test taking
//   async getTestInfo(testId) {
//     return this.client.get(`/test/${testId}`);
//   }

//   async registerForTest(testId, data) {
//     return this.client.post(`/test/${testId}/register`, data);
//   }

//   async getQuestions(testId) {
//     return this.client.get(`/test/${testId}/questions`);
//   }

//   async saveAnswer(testId, data) {
//     return this.client.post(`/test/${testId}/answer`, data);
//   }

//   async completeTest(testId, data) {
//     return this.client.post(`/test/${testId}/complete`, data);
//   }

//   // Reports
//   async getReports() {
//     return this.client.get('/reports');
//   }

//   async getReportStatus(reportId) {
//     return this.client.get(`/reports/${reportId}/status`);
//   }

//   async downloadPDF(reportId) {
//     const response = await this.client.get(`/reports/${reportId}/pdf`, {
//       responseType: 'blob',
//     });
//     return response;
//   }

//   // Dashboard
//   async getDashboardStats() {
//     return this.client.get('/dashboard/stats');
//   }
// }

// export default new ApiService();