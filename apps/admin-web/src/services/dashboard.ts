import api from './api';
import type { ApiResponse } from './api';

export interface OverviewData {
  totalApplications: number;
  approved: number;
  pending: number;
  benefitsDisbursed: number;
  activeSchemes: number;
  registeredCitizens: number;
}

export interface RealtimeData {
  activeUsers: number;
  applicationsToday: number;
  grievancesOpen: number;
  verificationsQueued: number;
}

export interface TrendData {
  date: string;
  applications: number;
  approvals: number;
  rejections: number;
}

export async function getOverview(): Promise<OverviewData> {
  const { data } = await api.get<ApiResponse<OverviewData>>('/dashboard/overview');
  return data.data;
}

export async function getRealtime(): Promise<RealtimeData> {
  const { data } = await api.get<ApiResponse<RealtimeData>>('/dashboard/realtime');
  return data.data;
}

export async function getTrends(params?: { days?: number }): Promise<TrendData[]> {
  const { data } = await api.get<ApiResponse<TrendData[]>>('/dashboard/trends', { params });
  return data.data;
}
