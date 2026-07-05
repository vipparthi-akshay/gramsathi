'use client';

import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MenuIcon from '@mui/icons-material/Menu';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import GramChatBubble from '@/components/ai/GramChatBubble';
import GramVoiceOrb from '@/components/ai/GramVoiceOrb';
import { GramSuggestionRow } from '@/components/ai/GramSuggestionChip';
import GramButton from '@/components/ui/GramButton';
import GramBottomNav from '@/components/ui/GramBottomNav';
import { useChatStore, Message } from '@/store/chatStore';
import { useAppStore } from '@/store/appStore';
import { useVoice } from '@/hooks/useVoice';

const suggestions = [
  'What schemes am I eligible for?',
  'How to apply for PM Kisan?',
  'Track my application status',
  'Documents needed for Aadhaar',
  'Latest agriculture schemes',
];

export default function AIPage() {
  const { t } = useTranslation();
  const {
    conversations,
    activeConversationId,
    isTyping,
    createConversation,
    setActiveConversation,
    addMessage,
    setIsTyping,
    deleteConversation,
  } = useChatStore();

  const { language } = useAppStore();
  const { state: voiceState, startListening, stopListening, transcript } = useVoice();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConv?.messages || [];

  useEffect(() => {
    if (!activeConversationId) {
      const id = createConversation(language);
      setActiveConversation(id);
    }
  }, [activeConversationId, createConversation, setActiveConversation, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSend = () => {
    if (!input.trim() || !activeConversationId) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      language,
      type: 'text',
    };
    addMessage(activeConversationId, userMsg);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: getAIReply(userMsg.content),
        timestamp: Date.now(),
        language,
        type: 'text',
      };
      addMessage(activeConversationId, aiMsg);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestion = (label: string) => {
    setInput(label);
  };

  const handleVoiceToggle = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Mock reply function updated with t() where possible, or returning the english fallback
  // In a real app this would call an API, but since it's mock, we'll try to translate it using t() if we had those keys.
  // We'll leave the mock replies mostly intact, but they should really come from a backend.
  const getAIReply = (inputMsg: string): string => {
    const lower = inputMsg.toLowerCase();
    if (lower.includes('pm kisan') || lower.includes('kisan'))
      return t('mockAI.kisan', 'PM Kisan Samman Nidhi provides ₹6,000 per year to eligible farmers. You can apply at your local agriculture office or online. Would you like me to help you check eligibility?');
    if (lower.includes('eligible') || lower.includes('scheme'))
      return t('mockAI.eligible', 'Based on your profile, you may be eligible for several schemes including PM Awas Yojana, PM Kisan, and Ujjwala Yojana. I can check your eligibility in detail. Would you like to proceed?');
    if (lower.includes('document') || lower.includes('aadhaar'))
      return t('mockAI.document', 'For most schemes, you need: Aadhaar Card, Bank Passbook, Income Certificate, and Domicile Certificate. You can upload these in the Documents section.');
    if (lower.includes('track') || lower.includes('status') || lower.includes('application'))
      return t('mockAI.track', 'To track your application status, please go to the Applications section. You can also say your application number and I can look it up for you.');
    if (lower.includes('agriculture') || lower.includes('crop'))
      return t('mockAI.agriculture', 'There are several agriculture schemes: PM-Kisan (income support), PMFBY (crop insurance), and Soil Health Card scheme. Which one interests you?');
    return t('mockAI.default', 'I understand you need help with government services. Could you please tell me more about what you are looking for? You can ask about schemes, documents, applications, or any other service.');
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#f8fafd' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <IconButton onClick={() => setSidebarOpen(true)} aria-label="Open conversation history">
            <MenuIcon />
          </IconButton>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1, background: 'linear-gradient(135deg, #1565C0, #0D47A1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('ai.gramBot', 'GramBot')}
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2, display: 'flex', flexDirection: 'column' }}>
          {currentMessages.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: -4 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <Box sx={{ 
                  position: 'relative', 
                  width: 150, 
                  height: 150, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -20, left: -20, right: -20, bottom: -20,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(25,118,210,0.15) 0%, rgba(25,118,210,0) 70%)',
                    animation: 'pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
                  }
                }}>
                  <GramVoiceOrb state="idle" size={120} />
                </Box>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <Typography variant="h6" color="text.primary" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                  {t('ai.askQuestion', 'Ask me anything about government schemes')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('ai.typeHere', 'Type your question or tap the microphone to speak')}
                </Typography>
              </motion.div>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {currentMessages.map((msg) => (
                <GramChatBubble key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1, mt: 1 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: 1, overflow: 'hidden' }}>
                    <img src="/logo.png" alt="Bot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    {t('ai.aiThinking', 'GramBot is thinking...')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {currentMessages.length === 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <GramSuggestionRow
              suggestions={suggestions.map(s => t(`ai.suggestions.${s.replace(/[^a-zA-Z]/g, '')}`, s))}
              onSelect={handleSuggestion}
            />
          </Box>
        )}

        <Box
          sx={{
            px: 2,
            py: 2,
            background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0.8) 100%)' : 'linear-gradient(to top, rgba(248,250,253,1) 0%, rgba(248,250,253,0.8) 100%)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            bottom: 56,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'background.paper', borderRadius: 8, p: 0.5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              sx={{ color: 'text.secondary' }}
            >
              <AttachFileIcon />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,.pdf"
              onChange={(e) => {
                if (e.target.files?.[0] && activeConversationId) {
                  const docMsg: Message = {
                    id: `msg_${Date.now()}_doc`,
                    role: 'user',
                    content: `Uploaded: ${e.target.files[0].name}`,
                    timestamp: Date.now(),
                    language,
                    type: 'document',
                    metadata: { fileName: e.target.files[0].name },
                  };
                  addMessage(activeConversationId, docMsg);
                }
              }}
            />
            <TextField
              fullWidth
              variant="standard"
              placeholder={t('ai.typeMessage', 'Type your message...')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '0.95rem' }
              }}
              aria-label="Message input"
            />
            <IconButton
              onClick={handleVoiceToggle}
              sx={{
                bgcolor: voiceState === 'listening' ? 'error.main' : 'primary.light',
                color: voiceState === 'listening' ? '#fff' : 'primary.main',
                '&:hover': {
                  bgcolor: voiceState === 'listening' ? 'error.dark' : 'primary.main',
                  color: '#fff',
                }
              }}
              aria-label={voiceState === 'listening' ? 'Stop recording' : 'Start voice input'}
            >
              <MicIcon />
            </IconButton>
            <IconButton 
              color="primary" 
              onClick={handleSend} 
              disabled={!input.trim()} 
              aria-label="Send message"
              sx={{ 
                bgcolor: 'primary.main', 
                color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <GramBottomNav />

      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{ sx: { width: 280, borderRadius: '0 16px 16px 0' } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon />
            <Typography variant="h6" fontWeight={600}>
              {t('ai.conversations', 'Conversations')}
            </Typography>
          </Box>
          <GramButton
            variant="tonal"
            fullWidth
            icon={<SmartToyIcon />}
            onClick={() => {
              const id = createConversation(language);
              setActiveConversation(id);
              setSidebarOpen(false);
            }}
          >
            {t('ai.newChat', 'New Chat')}
          </GramButton>
          <List sx={{ mt: 2 }}>
            {conversations.map((conv) => (
              <ListItemButton
                key={conv.id}
                selected={conv.id === activeConversationId}
                onClick={() => {
                  setActiveConversation(conv.id);
                  setSidebarOpen(false);
                }}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SmartToyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={conv.title || t('ai.newConversation', 'New conversation')}
                  primaryTypographyProps={{
                    noWrap: true,
                    variant: 'body2',
                    fontWeight: conv.id === activeConversationId ? 600 : 400,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  aria-label="Delete conversation"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
