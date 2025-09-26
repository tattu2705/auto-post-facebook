// Auth Service Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  subscription_plan: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  subscription_plan?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}