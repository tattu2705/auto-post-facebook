import axios, { AxiosResponse, AxiosError } from 'axios';

interface UploadOptions {
  delay?: number;
  headless?: boolean;
  timeout?: number;
  debug?: boolean;
}

interface UploadResult {
  url: string;
  success: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  statistics: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
  };
  results: UploadResult[];
}

interface UploadError {
  success: false;
  message: string;
  error?: string;
  errors?: any[];
}

class UploadService {
  private baseUrl = 'http://localhost:8080'; // Adjust this to your backend URL
  private axiosInstance = axios.create({
    timeout: 60000, // 60 seconds timeout
    headers: {
      'Accept': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for authentication and logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`Response received:`, response.status, response.statusText);
        return response;
      },
      async (error) => {
        console.error('Response interceptor error:', error.response?.status, error.response?.statusText);
        
        // Handle 401 unauthorized - token might be expired
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              // Try to refresh token
              const refreshResponse = await axios.post(`${this.baseUrl}/api/auth/refresh`, {
                refreshToken
              });
              
              const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
              
              // Update stored tokens
              localStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              
              // Retry the original request with new token
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance.request(error.config);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload comment to multiple Facebook URLs
   * @param comment - The comment text to post
   * @param urls - Array of Facebook URLs to post to
   * @param cookiesContent - Raw cookies file content (optional)
   * @param cookiesFileName - Name of the cookies file (optional)
   * @param options - Additional options for the upload
   */
  async uploadComment(
    comment: string,
    urls: string[],
    cookiesContent?: string | null,
    cookiesFileName?: string | null,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      
      // Add required fields
      formData.append('comment', comment);
      formData.append('urls', JSON.stringify(urls));
      
      // Add optional configuration
      if (options.delay !== undefined) {
        formData.append('delay', options.delay.toString());
      }
      if (options.headless !== undefined) {
        formData.append('headless', options.headless.toString());
      }
      if (options.timeout !== undefined) {
        formData.append('timeout', options.timeout.toString());
      }
      if (options.debug !== undefined) {
        formData.append('debug', options.debug.toString());
      }

      // Add cookies file if provided
      if (cookiesContent && cookiesFileName) {
        const cookiesBlob = new Blob([cookiesContent], { type: 'text/plain' });
        formData.append('cookieFile', cookiesBlob, cookiesFileName);
      }

      const response: AxiosResponse<UploadResponse> = await this.axiosInstance.post(
        `${this.baseUrl}/api/upload/comment`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Override timeout for this specific request since uploads might take longer
          timeout: 300000, // 5 minutes for upload operations
        }
      );

      return response.data;
    } catch (error) {
      console.error('Upload service error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<UploadError>;
        
        if (axiosError.response) {
          // Server responded with error status
          const errorMessage = axiosError.response.data?.message || 
                              axiosError.response.statusText || 
                              `HTTP error! status: ${axiosError.response.status}`;
          throw new Error(errorMessage);
        } else if (axiosError.request) {
          // Request was made but no response received
          throw new Error('Network error: No response received from server');
        } else {
          // Something else happened
          throw new Error(`Request error: ${axiosError.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Check upload service status
   */
  async getStatus(): Promise<{ success: boolean; message: string; service: string; timestamp: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string; service: string; timestamp: string }> = 
        await this.axiosInstance.get(`${this.baseUrl}/api/upload/status`);
      
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          throw new Error(`HTTP error! status: ${axiosError.response.status}`);
        } else if (axiosError.request) {
          throw new Error('Network error: No response received from server');
        } else {
          throw new Error(`Request error: ${axiosError.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Set base URL for the API
   * @param url - The base URL of the backend API
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
    // Update axios instance base URL
    this.axiosInstance.defaults.baseURL = url;
  }

  /**
   * Set authorization token for requests
   * @param token - Bearer token for authentication
   */
  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  removeAuthToken() {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  /**
   * Get current axios instance for advanced configuration
   */
  getAxiosInstance() {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;

// Export types for use in components
export type { UploadOptions, UploadResult, UploadResponse, UploadError };
