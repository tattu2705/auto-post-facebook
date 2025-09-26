// Cookie File Types
export interface CookieFile {
  id: number;
  name: string;
  file_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cookies_count: number;
  content?: string; // Only included when specifically requested
}

export interface CreateCookieFileRequest {
  cookieFile: File; // File to upload
}

export interface CookieFileResponse {
  id: number;
  name: string;
  file_size: number;
  cookies_count: number;
  created_at: string;
  firebase_path: string;
  download_url: string
}

// Comment History Types
export interface CommentHistory {
  id: number;
  comment_text: string;
  target_urls: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_links: number;
  estimated_duration?: number;
  created_at: string;
  cookie_file_path?: string;
}

export interface CreateCommentHistoryRequest {
  comment_text: string;
  target_urls: string;
  cookie_file_path?: string | null;
  estimated_duration?: number;
}

export interface UpdateCommentHistoryRequest {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  successful_links?: number;
  failed_links?: number;
  actual_duration?: number;
}

export interface CommentHistoryListItem {
  id: number;
  comment_text: string; // Truncated version
  status: string;
  total_links: number;
  successful_links: number;
  failed_links: number;
  estimated_duration?: number;
  actual_duration?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  cookie_file?: {
    id: number;
    name: string;
  };
}

// User Stats Types
export interface UserStats {
  total_histories: number;
  completed_histories: number;
  failed_histories: number;
  total_comments_posted: number;
  success_rate: string;
  total_time_spent: number; // in seconds
  active_cookie_files: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  total?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

// Error Types
export interface ApiError {
  success: false;
  message: string;
  error?: string;
  invalid_urls?: string[];
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}