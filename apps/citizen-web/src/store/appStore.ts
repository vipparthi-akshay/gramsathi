import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccessibilityMode = 'normal' | 'highContrast' | 'largeText' | 'voiceOnly';
export type InputMode = 'voice' | 'text' | 'hybrid';

interface AppState {
  language: string;
  dialect: string;
  preferredInputMode: InputMode;
  accessibilityMode: AccessibilityMode;
  onboardingComplete: boolean;
  fontScale: number;
  setLanguage: (lang: string) => void;
  setDialect: (dialect: string) => void;
  setPreferredInputMode: (mode: InputMode) => void;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setFontScale: (scale: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      dialect: '',
      preferredInputMode: 'hybrid',
      accessibilityMode: 'normal',
      onboardingComplete: false,
      fontScale: 1,

      setLanguage: (lang) => set({ language: lang }),
      setDialect: (dialect) => set({ dialect }),
      setPreferredInputMode: (mode) => set({ preferredInputMode: mode }),
      setAccessibilityMode: (mode) => set({ accessibilityMode: mode }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setFontScale: (scale) => set({ fontScale: scale }),
    }),
    {
      name: 'gramsathi-app',
    }
  )
);
