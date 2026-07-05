"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore, Message } from "@/store/chatStore";
import { useAppStore } from "@/store/appStore";
import { getChatResponse } from "@/services/mockData";
import GramChatBubble from "./GramChatBubble";

const suggestions = [
  "Tell me about PM-KISAN",
  "Check MGNREGA status",
  "What documents do I need?",
  "When is my next installment?",
];

export default function GramFloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useAppStore();
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "Namaste! I am GramBot, your AI assistant. Ask me about government schemes, applications, or documents!",
        timestamp: Date.now(),
        language: "en",
        type: "text",
      };
      setMessages([welcome]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
      language,
      type: "text",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(
      () => {
        const response = getChatResponse(text.trim());
        const botMsg: Message = {
          id: `bot_${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: Date.now(),
          language,
          type: "text",
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: 88,
              right: 16,
              zIndex: 1300,
              width: 360,
              maxWidth: "calc(100vw - 32px)",
              height: 520,
              maxHeight: "calc(100vh - 120px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 20,
              overflow: "hidden",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              backgroundColor: isDark
                ? "rgba(30, 30, 30, 0.85)"
                : "rgba(255, 255, 255, 0.85)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            role="dialog"
            aria-label="GramSathi AI Assistant chat"
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)"
                    : "linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)",
                color: "#fff",
              }}
            >
              <Avatar
                sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 36, height: 36 }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  fontSize="0.9rem"
                >
                  GramBot AI
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, fontSize: "0.7rem" }}
                >
                  Online - Ask me anything
                </Typography>
              </Box>
              <IconButton
                size="small"
                sx={{ color: "#fff" }}
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.15)",
                  borderRadius: 4,
                },
              }}
            >
              {messages.map((msg) => (
                <GramChatBubble key={msg.id} message={msg} />
              ))}
              {isTyping && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    px: 2,
                    py: 1,
                  }}
                >
                  <Avatar
                    sx={{ width: 28, height: 28, bgcolor: "secondary.light" }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: "16px 16px 16px 4px",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#2D2D2D" : "#F0F0F0",
                      display: "flex",
                      gap: 0.5,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        component="span"
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "text.disabled",
                          animation: "bounce 1.4s ease-in-out infinite",
                          animationDelay: `${i * 0.16}s`,
                          "@keyframes bounce": {
                            "0%, 80%, 100%": {
                              transform: "scale(0.6)",
                              opacity: 0.4,
                            },
                            "40%": { transform: "scale(1)", opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            {messages.length <= 1 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Quick questions:
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {suggestions.map((s) => (
                    <Box
                      key={s}
                      component="button"
                      onClick={() => handleSuggestion(s)}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 16,
                        border: "1px solid",
                        borderColor: "primary.main",
                        color: "primary.main",
                        bgcolor: "transparent",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "primary.main",
                          color: "#fff",
                        },
                      }}
                    >
                      {s}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}
            >
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  size="small"
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  multiline
                  maxRows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 24,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <IconButton
                        size="small"
                        sx={{ mr: 0.5 }}
                        aria-label="Voice input"
                      >
                        <MicIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
                <Fab
                  size="small"
                  color="primary"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                  sx={{ width: 40, height: 40, minWidth: 40 }}
                >
                  <SendIcon fontSize="small" />
                </Fab>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ position: "fixed", bottom: 16, right: 16, zIndex: 1300 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={open}
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Fab
            color="primary"
            aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
            onClick={() => setOpen(!open)}
            sx={{
              width: 60,
              height: 60,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #1565C0, #0D47A1)"
                  : "linear-gradient(135deg, #1565C0, #0D47A1)",
              "&:hover": {
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #1976D2, #1565C0)"
                    : "linear-gradient(135deg, #1976D2, #1565C0)",
              },
              boxShadow: "0 4px 20px rgba(21, 101, 192, 0.4)",
            }}
          >
            {open ? (
              <CloseIcon />
            ) : (
              <AutoAwesomeIcon
                sx={{ animation: "pulse-glow 2s ease-in-out infinite" }}
              />
            )}
          </Fab>
        </Badge>
      </motion.div>
    </>
  );
}
