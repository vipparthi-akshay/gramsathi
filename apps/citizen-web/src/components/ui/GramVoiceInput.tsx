'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { styled, keyframes } from '@mui/material/styles';

declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

const langMap: Record<string, string> = {
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  pa: 'pa-IN',
  en: 'en-US',
};

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const ripple = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(21, 101, 192, 0.4); }
  100% { box-shadow: 0 0 0 24px rgba(21, 101, 192, 0); }
`;

const MicButton = styled(IconButton)<{ isrecording?: string }>(({ theme, isrecording }) => ({
  width: 72,
  height: 72,
  backgroundColor: isrecording === 'true' ? theme.palette.error.main : theme.palette.primary.main,
  color: '#fff',
  '&:hover': {
    backgroundColor: isrecording === 'true' ? theme.palette.error.dark : theme.palette.primary.dark,
  },
  animation: isrecording === 'true' ? `${ripple} 1.5s infinite` : 'none',
  transition: 'background-color 0.3s ease',
}));

const WaveformContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  height: 48,
});

const WaveBar = styled('span')<{ delay: number; active?: string }>(({ delay, active }) => ({
  width: 4,
  height: active === 'true' ? 32 : 8,
  backgroundColor: active === 'true' ? '#1565C0' : '#C3C6CF',
  borderRadius: 2,
  animation: active === 'true' ? `${pulse} 0.6s ${delay}s ease-in-out infinite` : 'none',
  transition: 'height 0.1s ease',
}));

interface GramVoiceInputProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  disabled?: boolean;
}

export default function GramVoiceInput({
  onResult,
  onError,
  language = 'hi-IN',
  disabled = false,
}: GramVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in (window as any) || 'SpeechRecognition' in (window as any))) {
      onError?.('common:voiceNotSupported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = langMap[language] || 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setIsProcessing(false);
    };

    recognition.onresult = (event: any) => {
      const results: any[] = Array.from(event.results);
      const transcript = results
        .map((result: any) => result[0].transcript)
        .join('');

      if (results[0].isFinal) {
        setIsProcessing(true);
        onResult(transcript);
        setTimeout(() => {
          setIsRecording(false);
          setIsProcessing(false);
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      setIsProcessing(false);
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        onError?.('common:microphonePermission');
      } else {
        onError?.(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onResult, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <MicButton
        isrecording={isRecording ? 'true' : 'false'}
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        aria-pressed={isRecording}
        size="large"
      >
        {isProcessing ? (
          <CircularProgress size={32} color="inherit" />
        ) : isRecording ? (
          <MicOffIcon fontSize="large" />
        ) : (
          <MicIcon fontSize="large" />
        )}
      </MicButton>

      <Typography variant="body2" color="text.secondary" aria-live="polite">
        {isProcessing
          ? 'common:processing'
          : isRecording
          ? 'common:listening'
          : 'common:tapToSpeak'}
      </Typography>

      {isRecording && (
        <WaveformContainer role="img" aria-label="Audio waveform">
          {[0, 1, 2, 3, 4].map((i) => (
            <WaveBar key={i} delay={i * 0.1} active="true" />
          ))}
        </WaveformContainer>
      )}
    </Box>
  );
}
