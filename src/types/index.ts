// Re-export all types
export * from './auth';
export * from './upload';
export * from './database';

// Common types
export interface ProcessConfig {
  comment: string;
  urls: string[];
  cookieFileId?: number;
  intervalTime: number;
  isContinuous: boolean;
  cycleInterval?: number;
}

export interface ProcessResult {
  success: boolean;
  message: string;
  statistics: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
  };
  results?: any[];
  historyId?: number;
}