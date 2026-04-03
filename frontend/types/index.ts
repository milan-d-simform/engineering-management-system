export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MEMBER';

export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  bio?: string;
  role: UserRole;
  teamId?: string | Team;
  projects: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  _id: string;
  id: string;
  name: string;
  description?: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  role?: UserRole;
  teamId?: string;
  projects?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  role?: UserRole;
  teamId?: string;
  projects?: string[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}
