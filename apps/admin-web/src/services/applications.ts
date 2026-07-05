import api from './api';
import type { ApiResponse, PaginatedResponse } from './api';

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_required';

export interface Application {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  schemeId: string;
  schemeName: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: ApplicationDocument[];
  aiRecommendation?: string;
  aiConfidence?: number;
  notes?: string;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ReviewAction {
  status: ApplicationStatus;
  notes?: string;
  documents?: string[];
}

export async function getApplications(params?: { page?: number; limit?: number; status?: ApplicationStatus; search?: string; schemeId?: string }): Promise<PaginatedResponse<Application>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<Application>>>('/applications', { params });
  return data.data;
}

export async function getApplication(id: string): Promise<Application> {
  const { data } = await api.get<ApiResponse<Application>>(`/applications/${id}`);
  return data.data;
}

export async function reviewApplication(id: string, action: ReviewAction): Promise<Application> {
  const { data } = await api.post<ApiResponse<Application>>(`/applications/${id}/review`, action);
  return data.data;
}

export async function approveApplication(id: string, notes?: string): Promise<Application> {
  const { data } = await api.post<ApiResponse<Application>>(`/applications/${id}/approve`, { notes });
  return data.data;
}

export async function rejectApplication(id: string, reason: string): Promise<Application> {
  const { data } = await api.post<ApiResponse<Application>>(`/applications/${id}/reject`, { reason });
  return data.data;
}

export async function bulkApprove(ids: string[]): Promise<number> {
  const { data } = await api.post<ApiResponse<{ count: number }>>('/applications/bulk-approve', { ids });
  return data.data.count;
}

export async function getApplicationStats(): Promise<Record<ApplicationStatus, number>> {
  const { data } = await api.get<ApiResponse<Record<ApplicationStatus, number>>>('/applications/stats');
  return data.data;
}
