// Upload Service Types
export interface UploadOptions {
  delay?: number;
  headless?: boolean;
  timeout?: number;
  debug?: boolean;
}

export interface IntervalOptions extends UploadOptions {
  cycleInterval?: number; // milliseconds between cycles
  maxCycles?: number | null; // maximum cycles (null for unlimited)
}

export interface ProcessInfo {
  id: string;
  status: 'running' | 'running_cycle' | 'waiting' | 'stopped' | 'completed' | 'error';
  startTime: string;
  endTime?: string;
  currentCycle: number;
  completedCycles: number;
  totalCycles: number | null;
  urls: number;
  comment: string;
  lastCycleResult?: {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    timestamp: string;
  };
  nextCycleTime?: string;
  error?: string;
  duration: number; // milliseconds
}

export interface StartIntervalResponse {
  success: boolean;
  message: string;
  processId: string;
  config: {
    urls: number;
    cycleInterval: number;
    maxCycles: number | 'unlimited';
    delay: number;
  };
}

export interface StopProcessResponse {
  success: boolean;
  message: string;
  processId: string;
  finalStatus: {
    completedCycles: number;
    status: string;
    duration: number;
  };
}

export interface ProcessStatusResponse {
  success: boolean;
  process?: ProcessInfo;
  totalProcesses?: number;
  activeProcesses?: number;
  processes?: ProcessInfo[];
}

export interface UploadResult {
  url: string;
  success: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

export interface UploadResponse {
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

export interface UploadError {
  success: false;
  message: string;
  error?: string;
  errors?: any[];
}