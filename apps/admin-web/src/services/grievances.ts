import api from './api';
import type { ApiResponse, PaginatedResponse } from './api';

export type GrievanceStatus = 'open' | 'escalated' | 'resolved' | 'closed';
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'angry';

export interface Grievance {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  category: string;
  department: string;
  description: string;
  aiDraft?: string;
  status: GrievanceStatus;
  sentiment: SentimentType;
  sentimentScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  trackingEntries: TrackingEntry[];
}

export interface TrackingEntry {
  id: string;
  action: string;
  note: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export async function getGrievances(params?: { page?: number; limit?: number; status?: GrievanceStatus; search?: string; department?: string }): Promise<PaginatedResponse<Grievance>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<Grievance>>>('/grievances', { params });
  return data.data;
}

export async function getGrievance(id: string): Promise<Grievance> {
  const { data } = await api.get<ApiResponse<Grievance>>(`/grievances/${id}`);
  return data.data;
}

export async function assignGrievance(id: string, officerId: string): Promise<Grievance> {
  const { data } = await api.post<ApiResponse<Grievance>>(`/grievances/${id}/assign`, { officerId });
  return data.data;
}

export async function resolveGrievance(id: string, resolution: string): Promise<Grievance> {
  const { data } = await api.post<ApiResponse<Grievance>>(`/grievances/${id}/resolve`, { resolution });
  return data.data;
}

export async function escalateGrievance(id: string, reason: string): Promise<Grievance> {
  const { data } = await api.post<ApiResponse<Grievance>>(`/grievances/${id}/escalate`, { reason });
  return data.data;
}

export async function addTrackingEntry(id: string, entry: { action: string; note: string }): Promise<Grievance> {
  const { data } = await api.post<ApiResponse<Grievance>>(`/grievances/${id}/tracking`, entry);
  return data.data;
}
