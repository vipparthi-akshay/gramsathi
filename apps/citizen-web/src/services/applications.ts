import api from './api';

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  schemeNameLocal: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  applicationData: Record<string, any>;
  documents: string[];
  progress: number;
  submittedAt?: string;
  updatedAt: string;
  estimatedCompletion?: string;
  remarks?: string;
  timeline: ApplicationTimeline[];
}

export interface ApplicationTimeline {
  status: string;
  date: string;
  remarks?: string;
  actor?: string;
}

export const applicationApi = {
  createApplication: async (schemeId: string, data?: Record<string, any>): Promise<Application> => {
    const { data: res } = await api.post('/applications', { schemeId, applicationData: data });
    return res;
  },

  getApplications: async (filters?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/applications', { params: filters });
    return data;
  },

  getApplication: async (id: string): Promise<Application> => {
    const { data } = await api.get(`/applications/${id}`);
    return data;
  },

  updateApplication: async (id: string, applicationData: Record<string, any>): Promise<Application> => {
    const { data } = await api.put(`/applications/${id}`, { applicationData });
    return data;
  },

  submitApplication: async (id: string): Promise<Application> => {
    const { data } = await api.post(`/applications/${id}/submit`);
    return data;
  },

  cancelApplication: async (id: string): Promise<Application> => {
    const { data } = await api.post(`/applications/${id}/cancel`);
    return data;
  },

  getApplicationStatus: async (id: string): Promise<Application> => {
    const { data } = await api.get(`/applications/${id}/status`);
    return data;
  },
};
