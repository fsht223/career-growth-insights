// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // Test management methods
  async createTest(testData) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async getTests() {
    return this.request('/tests');
  }

  async deleteTest(testId) {
    return this.request(`/tests/${testId}`, {
      method: 'DELETE',
    });
  }

  // Test session methods (for customers)
  async getTestInfo(testId) {
    return this.request(`/test/${testId}`);
  }

  async registerForTest(testId, userData) {
    return this.request(`/test/${testId}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getTestQuestions(testId) {
    return this.request(`/test/${testId}/questions`);
  }

  async saveAnswer(testId, answerData) {
    return this.request(`/test/${testId}/answer`, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async completeTest(testId, sessionData) {
    return this.request(`/test/${testId}/complete`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Reports methods
  async getReports() {
    return this.request('/reports');
  }

  async getReport(reportId) {
    return this.request(`/reports/${reportId}`);
  }

  // PDF Status and Download methods
  async getReportStatus(reportId) {
    return this.request(`/reports/${reportId}/status`);
  }

  async downloadPDF(reportId) {
    const url = `${this.baseURL}/reports/${reportId}/pdf`;
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to download PDF');
    }

    // Return blob for download
    return response.blob();
  }

  // System status
  async getPDFQueueStatus() {
    return this.request('/system/pdf-status');
  }

  // Utility methods
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}

export default new ApiService();