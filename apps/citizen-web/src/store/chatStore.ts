import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  language: string;
  type: 'text' | 'voice' | 'document' | 'image';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  language: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  summary?: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isTyping: boolean;
  error: string | null;
  createConversation: (language: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setIsTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  clearActive: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isTyping: false,
      error: null,

      createConversation: (language) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const conv: Conversation = {
          id,
          title: '',
          language,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
        };
        set((state) => ({
          conversations: [conv, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: Date.now(),
                  title: c.title || (message.role === 'user' ? message.content.slice(0, 60) : ''),
                }
              : c
          ),
        })),

      setIsTyping: (typing) => set({ isTyping: typing }),
      setError: (error) => set({ error }),
      clearActive: () => set({ activeConversationId: null }),
    }),
    {
      name: 'gramsathi-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
