import api from './api';
import type { ApiResponse, PaginatedResponse } from './api';

export interface Scheme {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  nameTa?: string;
  description: string;
  category: string;
  department: string;
  eligibilityCriteria: Record<string, unknown>;
  benefits: string[];
  documentRequirements: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalApplicants: number;
  budget: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchemeFormData {
  name: string;
  nameHi?: string;
  nameMr?: string;
  nameTa?: string;
  description: string;
  category: string;
  department: string;
  eligibilityCriteria: Record<string, unknown>;
  benefits: string[];
  documentRequirements: string[];
  startDate: string;
  endDate: string;
  budget: number;
}

export async function getSchemes(params?: { page?: number; limit?: number; search?: string; category?: string; isActive?: boolean }): Promise<PaginatedResponse<Scheme>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<Scheme>>>('/schemes', { params });
  return data.data;
}

export async function getScheme(id: string): Promise<Scheme> {
  const { data } = await api.get<ApiResponse<Scheme>>(`/schemes/${id}`);
  return data.data;
}

export async function createScheme(scheme: SchemeFormData): Promise<Scheme> {
  const { data } = await api.post<ApiResponse<Scheme>>('/schemes', scheme);
  return data.data;
}

export async function updateScheme(id: string, scheme: Partial<SchemeFormData>): Promise<Scheme> {
  const { data } = await api.put<ApiResponse<Scheme>>(`/schemes/${id}`, scheme);
  return data.data;
}

export async function toggleSchemeActive(id: string): Promise<Scheme> {
  const { data } = await api.patch<ApiResponse<Scheme>>(`/schemes/${id}/toggle`);
  return data.data;
}

export async function deleteScheme(id: string): Promise<void> {
  await api.delete(`/schemes/${id}`);
}

export async function getSchemeCategories(): Promise<string[]> {
  const { data } = await api.get<ApiResponse<string[]>>('/schemes/categories');
  return data.data;
}
