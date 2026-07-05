'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseAccessibilityReturn {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersDarkMode: boolean;
  fontSize: number;
  announce: (message: string) => void;
  focusElement: (elementId: string) => void;
  trapFocus: (containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) => void;
}

export function useAccessibility(): UseAccessibilityReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    setPrefersReducedMotion(motionQuery.matches);
    setPrefersHighContrast(contrastQuery.matches);
    setPrefersDarkMode(darkQuery.matches);

    const storedFontSize = localStorage.getItem('gramsathi-font-size');
    if (storedFontSize) {
      setFontSize(parseInt(storedFontSize, 10));
      document.documentElement.style.fontSize = `${storedFontSize}px`;
    }

    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const handleContrastChange = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    const handleDarkChange = (e: MediaQueryListEvent) => setPrefersDarkMode(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    darkQuery.addEventListener('change', handleDarkChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      darkQuery.removeEventListener('change', handleDarkChange);
    };
  }, []);

  const announce = useCallback((message: string) => {
    let announcer = document.getElementById('a11y-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer!.textContent = message;
    });
  }, []);

  const focusElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.setAttribute('tabindex', '-1');
      element.focus();
    }
  }, []);

  const trapFocus = useCallback(
    (containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const focusableSelectors =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusableElements = container.querySelectorAll(focusableSelectors);
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      firstFocusable?.focus();

      return () => document.removeEventListener('keydown', handleKeyDown);
    },
    []
  );

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode,
    fontSize,
    announce,
    focusElement,
    trapFocus,
  };
}
