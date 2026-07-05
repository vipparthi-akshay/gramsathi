"use client";

import { useState, useRef, useCallback, useEffect } from "react";

declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

interface UseVoiceReturn {
  state: VoiceState;
  transcript: string;
  isSupported: boolean;
  hasPermission: boolean | null;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, language?: string) => void;
  stopSpeaking: () => void;
  error: string | null;
  audioLevel: number;
}

export function useVoice(language = "hi-IN"): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in (window as any) ||
      "SpeechRecognition" in (window as any) ||
      "speechSynthesis" in window);

  const startListening = useCallback(() => {
    if (!(
      "webkitSpeechRecognition" in (window as any) ||
      "SpeechRecognition" in (window as any)
    )) {
      setError("Voice input not supported");
      setState("error");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setState("listening");
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const results: any[] = Array.from(event.results);
      const current = results.map((r: any) => r[0].transcript).join("");
      setTranscript(current);

      if (results[0].isFinal) {
        setState("processing");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setHasPermission(false);
        setError("Microphone permission denied");
      } else {
        setError(`Voice error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      if (state === "listening") {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("idle");
  }, []);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (!("speechSynthesis" in window)) {
        setError("Speech synthesis not supported");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang || language;

      utterance.onstart = () => setState("speaking");
      utterance.onend = () => setState("idle");
      utterance.onerror = () => {
        setError("Speech synthesis error");
        setState("idle");
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    isSupported,
    hasPermission,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error,
    audioLevel,
  };
}
