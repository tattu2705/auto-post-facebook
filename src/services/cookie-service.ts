import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  CookieFile, 
  CookieFileResponse, 
  ApiResponse, 
  ApiError 
} from '../types';

class CookieService {
  private baseUrl = 'http://localhost:8080';
  private axiosInstance = axios.create({
    timeout: 30000,
    withCredentials: true,
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

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload a cookie file to the backend
   * @param file - The cookie file to upload
   * @returns Promise<CookieFileResponse>
   */
  async uploadCookieFile(file: File): Promise<CookieFileResponse> {
    try {
      const formData = new FormData();
      formData.append('cookieFile', file);

      const response: AxiosResponse<ApiResponse<CookieFileResponse>> = 
        await this.axiosInstance.post(
          `${this.baseUrl}/api/cookies/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to upload cookie file');
      }
      console.log(response.data)
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to upload cookie file'
        );
      }
      throw error;
    }
  }

  /**
   * Get all cookie files for the current user
   * @returns Promise<CookieFile[]>
   */
  async getCookieFiles(): Promise<CookieFile[]> {
    try {
      const response: AxiosResponse<ApiResponse<CookieFile[]>> = 
        await this.axiosInstance.get(`${this.baseUrl}/api/cookies`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch cookie files');
      }

      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch cookie files'
        );
      }
      throw error;
    }
  }

  /**
   * Get a specific cookie file by ID
   * @param cookieFileId - The ID of the cookie file
   * @param includeContent - Whether to include the cookie content
   * @returns Promise<CookieFile>
   */
  async getCookieFile(cookieFileId: number, includeContent: boolean = false): Promise<CookieFile> {
    try {
      const url = includeContent 
        ? `${this.baseUrl}/api/cookies/${cookieFileId}?include_content=true`
        : `${this.baseUrl}/api/cookies/${cookieFileId}`;

      const response: AxiosResponse<ApiResponse<CookieFile>> = 
        await this.axiosInstance.get(url);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Cookie file not found');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Cookie file not found');
        }
        
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch cookie file'
        );
      }
      throw error;
    }
  }

  /**
   * Delete a cookie file
   * @param cookieFileId - The ID of the cookie file to delete
   * @returns Promise<void>
   */
  async deleteCookieFile(cookieFileId: number): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse> = 
        await this.axiosInstance.delete(`${this.baseUrl}/api/cookies/${cookieFileId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete cookie file');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Cookie file not found');
        }
        
        throw new Error(
          axiosError.response?.data?.message || 'Failed to delete cookie file'
        );
      }
      throw error;
    }
  }

  /**
   * Validate cookie file format before upload
   * @param file - The file to validate
   * @returns boolean
   */
  validateCookieFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file extension
    const allowedExtensions = ['.txt', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'File must be a .txt or .json file'
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   * @param bytes - Size in bytes
   * @returns Formatted string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

export const cookieService = new CookieService();
export default cookieService;