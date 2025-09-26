import { cookieService } from './cookie-service';
import { commentHistoryService } from './comment-history-service';
import { 
  CookieFile, 
  CookieFileResponse,
  CommentHistory,
  CreateCommentHistoryRequest,
  UpdateCommentHistoryRequest,
  UserStats,
  PaginationParams 
} from '../types';

/**
 * Integrated database service that combines cookie and comment history operations
 * This service provides a unified interface for all database operations
 */
class DatabaseService {
  // Cookie File Operations
  cookie = {
    /**
     * Upload a cookie file
     * @param file - Cookie file to upload
     * @returns Promise<CookieFileResponse>
     */
    upload: async (file: File): Promise<CookieFileResponse> => {
      // Validate file before upload
      const validation = cookieService.validateCookieFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid cookie file');
      }
      
      return cookieService.uploadCookieFile(file);
    },

    /**
     * Get all cookie files
     * @returns Promise<CookieFile[]>
     */
    getAll: async (): Promise<CookieFile[]> => {
      return cookieService.getCookieFiles();
    },

    /**
     * Get cookie file by ID
     * @param id - Cookie file ID
     * @param includeContent - Whether to include content
     * @returns Promise<CookieFile>
     */
    getById: async (id: number, includeContent: boolean = false): Promise<CookieFile> => {
      return cookieService.getCookieFile(id, includeContent);
    },

    /**
     * Delete cookie file
     * @param id - Cookie file ID
     */
    delete: async (id: number): Promise<void> => {
      return cookieService.deleteCookieFile(id);
    },

    /**
     * Validate cookie file
     * @param file - File to validate
     * @returns Validation result
     */
    validate: (file: File) => {
      return cookieService.validateCookieFile(file);
    },

    /**
     * Format file size
     * @param bytes - Size in bytes
     * @returns Formatted size string
     */
    formatSize: (bytes: number): string => {
      return cookieService.formatFileSize(bytes);
    }
  };

  // Comment History Operations
  history = {
    /**
     * Create comment history
     * @param data - Comment history data
     * @returns Promise<CommentHistory>
     */
    create: async (data: CreateCommentHistoryRequest): Promise<CommentHistory> => {
      // Validate data before creation
      const validation = commentHistoryService.validateCommentHistoryData(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      return commentHistoryService.createCommentHistory(data);
    },

    /**
     * Get comment histories with pagination
     * @param params - Pagination parameters
     * @returns Promise with histories and pagination info
     */
    getAll: async (params?: PaginationParams) => {
      return commentHistoryService.getCommentHistories(params);
    },

    /**
     * Get comment history by ID
     * @param id - Comment history ID
     * @returns Promise<CommentHistory>
     */
    getById: async (id: number): Promise<CommentHistory> => {
      return commentHistoryService.getCommentHistory(id);
    },

    /**
     * Update comment history
     * @param id - Comment history ID
     * @param data - Update data
     * @returns Promise<CommentHistory>
     */
    update: async (id: number, data: UpdateCommentHistoryRequest): Promise<CommentHistory> => {
      return commentHistoryService.updateCommentHistory(id, data);
    },

    /**
     * Validate comment history data
     * @param data - Data to validate
     * @returns Validation result
     */
    validate: (data: CreateCommentHistoryRequest) => {
      return commentHistoryService.validateCommentHistoryData(data);
    },

    /**
     * Format duration
     * @param seconds - Duration in seconds
     * @returns Formatted duration string
     */
    formatDuration: (seconds: number): string => {
      return commentHistoryService.formatDuration(seconds);
    },

    /**
     * Get status color class
     * @param status - Status string
     * @returns CSS color class
     */
    getStatusColor: (status: string): string => {
      return commentHistoryService.getStatusColor(status);
    },

    /**
     * Get status icon
     * @param status - Status string
     * @returns Status icon
     */
    getStatusIcon: (status: string): string => {
      return commentHistoryService.getStatusIcon(status);
    },

    /**
     * Calculate success rate
     * @param successful - Successful count
     * @param total - Total count
     * @returns Success rate percentage
     */
    calculateSuccessRate: (successful: number, total: number): number => {
      return commentHistoryService.calculateSuccessRate(successful, total);
    }
  };

  // User Statistics
  stats = {
    /**
     * Get user statistics
     * @returns Promise<UserStats>
     */
    get: async (): Promise<UserStats> => {
      return commentHistoryService.getUserStats();
    }
  };

  // Combined Operations

  /**
   * Start a comment process with database integration
   * This creates a comment history record and returns the ID for tracking
   */

  /**
   * Complete a comment process with results
   */
  async completeCommentProcess(
    historyId: number,
    results: {
      successful: number;
      failed: number;
      actualDuration: number;
    }
  ): Promise<CommentHistory> {
    try {
      return await this.history.update(historyId, {
        status: 'completed',
        successful_links: results.successful,
        failed_links: results.failed,
        actual_duration: results.actualDuration
      });
    } catch (error) {
      console.error('Failed to complete comment process:', error);
      throw error;
    }
  }

  /**
   * Fail a comment process
   */
  async failCommentProcess(
    historyId: number,
    actualDuration: number
  ): Promise<CommentHistory> {
    try {
      return await this.history.update(historyId, {
        status: 'failed',
        actual_duration: actualDuration
      });
    } catch (error) {
      console.error('Failed to mark comment process as failed:', error);
      throw error;
    }
  }

  /**
   * Cancel a comment process
   */
  async cancelCommentProcess(
    historyId: number,
    actualDuration: number
  ): Promise<CommentHistory> {
    try {
      return await this.history.update(historyId, {
        status: 'cancelled',
        actual_duration: actualDuration
      });
    } catch (error) {
      console.error('Failed to cancel comment process:', error);
      throw error;
    }
  }

  /**
   * Get cookie content for a comment process
   */
  async getCookieContentForProcess(cookieFileId: number): Promise<string> {
    try {
      const cookieFile = await this.cookie.getById(cookieFileId, true);
      return cookieFile.content || '';
    } catch (error) {
      console.error('Failed to get cookie content:', error);
      return '';
    }
  }

  /**
   * Validate URLs format
   */
  validateUrls(urls: string[]): { valid: string[]; invalid: string[] } {
    const urlRegex = /^https?:\/\/.+/;
    const valid = urls.filter(url => urlRegex.test(url));
    const invalid = urls.filter(url => !urlRegex.test(url));
    
    return { valid, invalid };
  }

  /**
   * Calculate estimated duration for a comment process
   */
  calculateEstimatedDuration(urlCount: number, intervalSeconds: number): number {
    const AVERAGE_TIME_PER_COMMENT = 15; // seconds
    return (urlCount * AVERAGE_TIME_PER_COMMENT) + ((urlCount - 1) * intervalSeconds);
  }
}

export const databaseService = new DatabaseService();
export default databaseService;

// Export individual services for direct access if needed
export { cookieService, commentHistoryService };