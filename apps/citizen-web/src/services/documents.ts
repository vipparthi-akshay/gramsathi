import api from './api';

export interface Document {
  id: string;
  type: string;
  typeLocal: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'verified' | 'pending' | 'rejected' | 'needs_review';
  extractedData?: Record<string, string>;
  confidence?: number;
  verifiedAt?: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  documentUrl: string;
}

export const documentApi = {
  uploadDocument: async (file: File, type: string, onProgress?: (percent: number) => void): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const { data } = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return data;
  },

  getDocuments: async () => {
    const { data } = await api.get('/documents');
    return data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  getExtractedData: async (id: string) => {
    const { data } = await api.get(`/documents/${id}/extracted`);
    return data;
  },

  verifyDocument: async (id: string): Promise<Document> => {
    const { data } = await api.post(`/documents/${id}/verify`);
    return data;
  },
};
