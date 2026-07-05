'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { styled } from '@mui/material/styles';
import type { Message } from '@/store/chatStore';

const BubbleContainer = styled(Box)<{ role: string }>(({ theme, role }) => ({
  display: 'flex',
  gap: 8,
  maxWidth: '85%',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  flexDirection: role === 'user' ? 'row-reverse' : 'row',
  marginBottom: 8,
}));

const Bubble = styled(Box)<{ role: string }>(({ theme, role }) => ({
  padding: '12px 16px',
  borderRadius: role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  backgroundColor:
    role === 'user'
      ? theme.palette.primary.main
      : theme.palette.mode === 'dark'
      ? '#2D2D2D'
      : '#F0F0F0',
  color:
    role === 'user'
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
  wordBreak: 'break-word',
}));

const StreamingText = styled(Typography)({
  '& .cursor': {
    display: 'inline-block',
    width: 2,
    height: '1em',
    backgroundColor: '#1565C0',
    animation: 'blink 1s step-end infinite',
    '@keyframes blink': {
      '50%': { opacity: 0 },
    },
  },
});

interface GramChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onShare?: () => void;
  onReadAloud?: () => void;
  onFeedback?: (helpful: boolean) => void;
}

export default function GramChatBubble({
  message,
  isStreaming = false,
  onCopy,
  onShare,
  onReadAloud,
  onFeedback,
}: GramChatBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isStreaming && message.role === 'assistant') {
      let i = 0;
      const text = message.content;
      const interval = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(message.content);
    }
  }, [message.content, isStreaming, message.role]);

  return (
    <BubbleContainer role={message.role}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: message.role === 'user' ? 'primary.light' : 'secondary.light',
        }}
        aria-hidden="true"
      >
        {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
      </Avatar>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
        <Bubble role={message.role}>
          {message.type === 'document' && message.metadata?.fileName && (
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              📄 {message.metadata.fileName}
            </Typography>
          )}
          <StreamingText variant="body1">
            {displayedText}
            {isStreaming && displayedText.length < message.content.length && (
              <span className="cursor" />
            )}
          </StreamingText>
        </Bubble>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            px: 1,
          }}
        >
          {message.role === 'assistant' && (
            <>
              <IconButton
                size="small"
                onClick={() => setAnchorEl(document.getElementById(`menu-${message.id}`))}
                aria-label="Message options"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                {onCopy && (
                  <MenuItem onClick={() => { onCopy(); setAnchorEl(null); }}>
                    <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} /> Copy
                  </MenuItem>
                )}
                {onShare && (
                  <MenuItem onClick={() => { onShare(); setAnchorEl(null); }}>
                    <ShareIcon fontSize="small" sx={{ mr: 1 }} /> Share
                  </MenuItem>
                )}
                {onReadAloud && (
                  <MenuItem onClick={() => { onReadAloud(); setAnchorEl(null); }}>
                    <VolumeUpIcon fontSize="small" sx={{ mr: 1 }} /> Read Aloud
                  </MenuItem>
                )}
              </Menu>
              {onFeedback && (
                <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                  <IconButton size="small" onClick={() => onFeedback(true)} aria-label="Helpful">
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onFeedback(false)} aria-label="Not helpful">
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </>
          )}
          <Typography variant="caption" color="text.disabled">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      </Box>
    </BubbleContainer>
  );
}
