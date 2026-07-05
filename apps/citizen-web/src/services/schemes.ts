import api from './api';

export interface Scheme {
  id: string;
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  category: string;
  ministry: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  matchScore?: number;
  deadline?: string;
  applicationCount?: number;
  budget?: string;
  howToApply: string;
  status: 'active' | 'closed' | 'coming_soon';
  createdAt: string;
  updatedAt: string;
}

export interface SchemeFilters {
  category?: string;
  search?: string;
  status?: string;
  sortBy?: 'match' | 'deadline' | 'name' | 'popularity';
  page?: number;
  limit?: number;
}

export const schemeApi = {
  getSchemes: async (filters: SchemeFilters = {}) => {
    const { data } = await api.get('/schemes', { params: filters });
    return data;
  },

  getScheme: async (id: string): Promise<Scheme> => {
    const { data } = await api.get(`/schemes/${id}`);
    return data;
  },

  getMatchedSchemes: async () => {
    const { data } = await api.get('/schemes/matched');
    return data;
  },

  checkEligibility: async (schemeId: string) => {
    const { data } = await api.post(`/schemes/${schemeId}/eligibility`);
    return data;
  },

  getCategories: async () => {
    const { data } = await api.get('/schemes/categories');
    return data;
  },

  searchSchemes: async (query: string, language: string) => {
    const { data } = await api.get('/schemes/search', {
      params: { query, language },
    });
    return data;
  },
};
