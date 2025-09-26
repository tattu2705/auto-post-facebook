import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  User, 
  AuthResponse, 
  SignUpData, 
  SignInData, 
  AuthError 
} from '../types/auth';

class AuthService {
  private baseUrl = 'http://localhost:8080'; // Adjust to your backend URL
  private axiosInstance = axios.create({
    timeout: 30000,
    withCredentials: true, // Important for cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.accessToken);
              localStorage.setItem('refreshToken', response.refreshToken);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        `${this.baseUrl}/api/auth/signup`,
        data
      );
      console.log(response)
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<AuthError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to sign up'
        );
      }
      throw error;
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
        `${this.baseUrl}/api/auth/signin`,
        data
      );

      const { user, accessToken, refreshToken } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<AuthError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to sign in'
        );
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.axiosInstance.post(`${this.baseUrl}/api/auth/signout`);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear local storage regardless of API call success
      this.logout();
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${this.baseUrl}/api/auth/refresh-token`,
      { refreshToken },
      { withCredentials: true }
    );

    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ success: boolean; user: User }> = 
      await this.axiosInstance.get(`${this.baseUrl}/api/auth/profile`);

    return response.data.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ success: boolean; user: User }> = 
      await this.axiosInstance.put(`${this.baseUrl}/api/auth/profile`, data);

    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await this.axiosInstance.post(`${this.baseUrl}/api/auth/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  }

  // Utility methods
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export const authService = new AuthService();
export default authService;