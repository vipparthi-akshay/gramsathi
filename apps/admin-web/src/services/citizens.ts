import api from "./api";
import type { ApiResponse, PaginatedResponse } from "./api";

export interface Citizen {
  id: string;
  name: string;
  phone: string;
  aadhaar: string;
  email?: string;
  age: number;
  gender: "male" | "female" | "other";
  state: string;
  district: string;
  block: string;
  village: string;
  address: string;
  isVerified: boolean;
  preferredLanguage: string;
  familyMembers: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  aadhaar?: string;
}

export interface CitizenApplication {
  id: string;
  schemeName: string;
  status: string;
  submittedAt: string;
}

export interface CitizenGrievance {
  id: string;
  category: string;
  status: string;
  createdAt: string;
}

export async function searchCitizens(params: {
  search?: string;
  state?: string;
  district?: string;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Citizen>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<Citizen>>>(
    "/citizens",
    { params },
  );
  return data.data;
}

export async function getCitizen(id: string): Promise<Citizen> {
  const { data } = await api.get<ApiResponse<Citizen>>(`/citizens/${id}`);
  return data.data;
}

export async function verifyCitizen(id: string): Promise<Citizen> {
  const { data } = await api.post<ApiResponse<Citizen>>(
    `/citizens/${id}/verify`,
  );
  return data.data;
}

export async function getCitizenApplications(
  id: string,
): Promise<CitizenApplication[]> {
  const { data } = await api.get<ApiResponse<CitizenApplication[]>>(
    `/citizens/${id}/applications`,
  );
  return data.data;
}

export async function getCitizenGrievances(
  id: string,
): Promise<CitizenGrievance[]> {
  const { data } = await api.get<ApiResponse<CitizenGrievance[]>>(
    `/citizens/${id}/grievances`,
  );
  return data.data;
}
