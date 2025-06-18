// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface TestData {
  projectName: string;
  goldenLine: string;
  language: string;
  reseller?: string;
  coachEmail: string;
  testeeEmail?: string;
  testCount: number;
  reportRecipient: string;
  description?: string;
  emailList?: string[];
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  profession: string;
  gdprAccepted: boolean;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
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
  async login(email: string, password: string): Promise<LoginResponse> {
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

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // Test management methods
  async createTest(testData: TestData): Promise<any> {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async getTests(): Promise<any[]> {
    return this.request('/tests');
  }

  async deleteTest(testId: string): Promise<any> {
    return this.request(`/tests/${testId}`, {
      method: 'DELETE',
    });
  }

  // Test session methods (for customers)
  async getTestInfo(testId: string): Promise<any> {
    return this.request(`/test/${testId}`);
  }

  async registerForTest(testId: string, userData: UserData): Promise<any> {
    return this.request(`/test/${testId}/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getTestQuestions(testId: string): Promise<any[]> {
    return this.request(`/test/${testId}/questions`);
  }

  async saveAnswer(testId: string, answerData: any): Promise<any> {
    return this.request(`/test/${testId}/answer`, {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  async completeTest(testId: string, sessionData: any): Promise<any> {
    return this.request(`/test/${testId}/complete`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  // Reports methods
  async getReports(): Promise<any[]> {
    return this.request('/reports');
  }

  async getReport(reportId: string): Promise<any> {
    return this.request(`/reports/${reportId}`);
  }

  // PDF Status and Download methods
  async getReportStatus(reportId: string): Promise<any> {
    return this.request(`/reports/${reportId}/status`);
  }

  async downloadPDF(reportId: string): Promise<Blob> {
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
  async getPDFQueueStatus(): Promise<any> {
    return this.request('/system/pdf-status');
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getCurrentUser(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}

export default new ApiService();