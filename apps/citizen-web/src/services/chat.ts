import api from './api';

export interface ChatResponse {
  message: string;
  conversationId: string;
  suggestions?: string[];
  documents?: any[];
  schemeRecommendations?: any[];
}

export const chatApi = {
  sendMessage: async (
    text: string,
    language: string,
    conversationId?: string
  ): Promise<ChatResponse> => {
    const { data } = await api.post('/chat/message', {
      text,
      language,
      conversationId,
    });
    return data;
  },

  sendVoiceMessage: async (
    audioBlob: Blob,
    language: string,
    conversationId?: string
  ): Promise<ChatResponse> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);
    if (conversationId) formData.append('conversationId', conversationId);
    const { data } = await api.post('/chat/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getHistory: async (conversationId: string) => {
    const { data } = await api.get(`/chat/conversations/${conversationId}`);
    return data;
  },

  getConversations: async () => {
    const { data } = await api.get('/chat/conversations');
    return data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/chat/conversations/${id}`);
  },

  getSuggestions: async (query: string, language: string) => {
    const { data } = await api.get('/chat/suggestions', {
      params: { query, language },
    });
    return data;
  },
};
