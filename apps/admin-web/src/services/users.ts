import api from './api';
import type { ApiResponse, PaginatedResponse } from './api';

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: 'officer' | 'admin' | 'super_admin';
  department: string;
  phone: string;
  isActive: boolean;
  lastLogin?: string;
  permissions: string[];
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  password: string;
}

export async function getUsers(params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }): Promise<PaginatedResponse<SystemUser>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<SystemUser>>>('/users', { params });
  return data.data;
}

export async function getUser(id: string): Promise<SystemUser> {
  const { data } = await api.get<ApiResponse<SystemUser>>(`/users/${id}`);
  return data.data;
}

export async function createUser(user: CreateUserData): Promise<SystemUser> {
  const { data } = await api.post<ApiResponse<SystemUser>>('/users', user);
  return data.data;
}

export async function updateUser(id: string, updates: Partial<SystemUser>): Promise<SystemUser> {
  const { data } = await api.put<ApiResponse<SystemUser>>(`/users/${id}`, updates);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function toggleUserActive(id: string): Promise<SystemUser> {
  const { data } = await api.patch<ApiResponse<SystemUser>>(`/users/${id}/toggle-active`);
  return data.data;
}

export async function updateUserPermissions(id: string, permissions: string[]): Promise<SystemUser> {
  const { data } = await api.put<ApiResponse<SystemUser>>(`/users/${id}/permissions`, { permissions });
  return data.data;
}
