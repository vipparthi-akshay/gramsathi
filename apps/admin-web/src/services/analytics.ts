import api from "./api";
import type { ApiResponse } from "./api";

export interface ImpactMetrics {
  citizensReached: number;
  benefitsAccessed: number;
  schemeAwareness: number;
  satisfaction: number;
}

export interface LanguageUsage {
  language: string;
  count: number;
  percentage: number;
}

export interface GeoData {
  state: string;
  code: string;
  applications: number;
  approved: number;
  citizens: number;
  color: string;
}

export interface SchemeCategoryData {
  category: string;
  count: number;
  budget: number;
}

export interface AIPerformance {
  autoApproved: number;
  suggestionsMade: number;
  accuracy: number;
  avgConfidence: number;
}

export async function getImpactMetrics(): Promise<ImpactMetrics> {
  const { data } =
    await api.get<ApiResponse<ImpactMetrics>>("/analytics/impact");
  return data.data;
}

export async function getLanguageUsage(): Promise<LanguageUsage[]> {
  const { data } = await api.get<ApiResponse<LanguageUsage[]>>(
    "/analytics/languages",
  );
  return data.data;
}

export async function getGeoData(): Promise<GeoData[]> {
  const { data } = await api.get<ApiResponse<GeoData[]>>("/analytics/geo");
  return data.data;
}

export async function getSchemeCategories(): Promise<SchemeCategoryData[]> {
  const { data } = await api.get<ApiResponse<SchemeCategoryData[]>>(
    "/analytics/scheme-categories",
  );
  return data.data;
}

export async function getAIPerformance(): Promise<AIPerformance> {
  const { data } = await api.get<ApiResponse<AIPerformance>>(
    "/analytics/ai-performance",
  );
  return data.data;
}
