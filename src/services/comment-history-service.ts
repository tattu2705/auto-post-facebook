import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  CommentHistory, 
  CommentHistoryListItem,
  CreateCommentHistoryRequest,
  UpdateCommentHistoryRequest,
  UserStats,
  ApiResponse, 
  ApiError,
  PaginationParams 
} from '../types';

class CommentHistoryService {
  private baseUrl = 'http://localhost:8080';
  private axiosInstance = axios.create({
    timeout: 30000,
    withCredentials: true,
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
   * Create a new comment history record
   * @param data - Comment history data
   * @returns Promise<CommentHistory>
   */
  async createCommentHistory(data: CreateCommentHistoryRequest): Promise<CommentHistory> {
    try {
      const response: AxiosResponse<ApiResponse<CommentHistory>> = 
        await this.axiosInstance.post(`${this.baseUrl}/api/history`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create comment history');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        // Handle validation errors
        if (axiosError.response?.status === 400) {
          if (axiosError.response.data.invalid_urls) {
            throw new Error(
              `Invalid URLs detected: ${axiosError.response.data.invalid_urls.join(', ')}`
            );
          }
        }
        
        throw new Error(
          axiosError.response?.data?.message || 'Failed to create comment history'
        );
      }
      throw error;
    }
  }

  /**
   * Get comment histories for the current user
   * @param params - Pagination parameters
   * @returns Promise<{ histories: CommentHistoryListItem[], pagination: any }>
   */
  async getCommentHistories(params: PaginationParams = {}): Promise<{
    histories: CommentHistoryListItem[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = params;
      
      const response: AxiosResponse<ApiResponse<CommentHistoryListItem[]>> = 
        await this.axiosInstance.get(`${this.baseUrl}/api/history`, {
          params: { page, limit }
        });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch comment histories');
      }

      return {
        histories: response.data.data || [],
        pagination: response.data.pagination || { page, limit, total: 0, has_more: false }
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch comment histories'
        );
      }
      throw error;
    }
  }

  /**
   * Get a specific comment history by ID
   * @param historyId - The ID of the comment history
   * @returns Promise<CommentHistory>
   */
  async getCommentHistory(historyId: number): Promise<CommentHistory> {
    try {
      const response: AxiosResponse<ApiResponse<CommentHistory>> = 
        await this.axiosInstance.get(`${this.baseUrl}/api/history/${historyId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Comment history not found');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Comment history not found');
        }
        
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch comment history'
        );
      }
      throw error;
    }
  }

  /**
   * Update a comment history record
   * @param historyId - The ID of the comment history
   * @param data - Update data
   * @returns Promise<CommentHistory>
   */
  async updateCommentHistory(
    historyId: number, 
    data: UpdateCommentHistoryRequest
  ): Promise<CommentHistory> {
    try {
      const response: AxiosResponse<ApiResponse<CommentHistory>> = 
        await this.axiosInstance.patch(`${this.baseUrl}/api/history/${historyId}`, data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update comment history');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Comment history not found');
        }
        
        throw new Error(
          axiosError.response?.data?.message || 'Failed to update comment history'
        );
      }
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns Promise<UserStats>
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response: AxiosResponse<ApiResponse<UserStats>> = 
        await this.axiosInstance.get(`${this.baseUrl}/api/history/stats`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch user stats');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        throw new Error(
          axiosError.response?.data?.message || 'Failed to fetch user stats'
        );
      }
      throw error;
    }
  }

  /**
   * Validate comment history creation data
   * @param data - Data to validate
   * @returns Validation result
   */
  validateCommentHistoryData(data: CreateCommentHistoryRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate comment text
    if (!data.comment_text || !data.comment_text.trim()) {
      errors.push('Comment text is required');
    }

    if (data.comment_text && data.comment_text.length > 8000) {
      errors.push('Comment text must be less than 8000 characters');
    }

    // Validate URLs
    const target_urls = JSON.parse(data.target_urls)
    if (!target_urls || target_urls.length === 0) {
      errors.push('At least one target URL is required');
    }

    if (target_urls && target_urls.length > 0) {
      const urlRegex = /^https?:\/\/.+/;
      const invalidUrls = target_urls.filter((url: any) => !urlRegex.test(url));
      
      if (invalidUrls.length > 0) {
        errors.push(`${invalidUrls.length} invalid URL(s) detected`);
      }
    }

    // Validate estimated duration
    if (data.estimated_duration && data.estimated_duration < 0) {
      errors.push('Estimated duration must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format duration in seconds to human readable format
   * @param seconds - Duration in seconds
   * @returns Formatted string
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Get status color for UI display
   * @param status - Comment history status
   * @returns CSS color class
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get status icon for UI display
   * @param status - Comment history status
   * @returns Status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '🔄';
      case 'cancelled':
        return '⏸️';
      case 'pending':
        return '⏳';
      default:
        return '⏹️';
    }
  }

  /**
   * Calculate success rate percentage
   * @param successful - Number of successful operations
   * @param total - Total number of operations
   * @returns Success rate percentage
   */
  calculateSuccessRate(successful: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  }
}

export const commentHistoryService = new CommentHistoryService();
export default commentHistoryService;