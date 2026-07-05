'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    tonal: true;
  }
}

import { keyframes } from '@emotion/react';

declare module '@mui/material/styles' {
  interface TypeBackground {
    glass?: string;
    gradient?: string;
  }
}

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const glassBgLight = 'rgba(255, 255, 255, 0.72)';
export const glassBgDark = 'rgba(30, 30, 30, 0.72)';
export const glassBorderLight = 'rgba(255, 255, 255, 0.3)';
export const glassBorderDark = 'rgba(255, 255, 255, 0.08)';

const sharedTheme: ThemeOptions = {
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", sans-serif',
    h1: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Outfit", "Plus Jakarta Sans", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: '"Inter", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", "Noto Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Inter", "Poppins", "Noto Sans Devanagari", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 28,
          padding: '10px 24px',
          minHeight: 48,
          fontSize: '1rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
          '&.MuiButton-sizeSmall': {
            borderRadius: 20,
            padding: '6px 16px',
            minHeight: 36,
            fontSize: '0.875rem',
          },
          '&.MuiButton-sizeLarge': {
            borderRadius: 32,
            padding: '14px 32px',
            minHeight: 56,
            fontSize: '1.125rem',
          },
        },
        contained: {
          boxShadow: '0px 2px 6px 2px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)',
          '&:hover': {
            boxShadow: '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.30)',
          },
          '&:active': {
            boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.30)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
      variants: [
        {
          props: { variant: 'tonal' },
          style: {
            backgroundColor: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)',
            '&:hover': {
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              opacity: 0.9,
            },
          },
        },
      ],
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          width: 64,
          height: 64,
          boxShadow: '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px 0px rgba(0,0,0,0.30)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px 0px rgba(0,0,0,0.30)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0px 2px 6px 2px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.30)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          height: 36,
          fontSize: '0.875rem',
        },
        filled: {
          backgroundColor: 'var(--md-sys-color-surface-variant)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 72,
          backgroundColor: 'var(--md-sys-color-surface)',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            fontWeight: 500,
            marginTop: 4,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            '& fieldset': {
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderWidth: 2,
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          strokeWidth: 4,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 32,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 4,
            '&.Mui-checked': {
              transform: 'translateX(20px)',
            },
          },
          '& .MuiSwitch-thumb': {
            width: 24,
            height: 24,
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 16,
            opacity: 1,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          borderRadius: 4,
          height: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 48,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 40,
          height: 40,
          borderRadius: '50%',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          marginBottom: 2,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...sharedTheme,
  palette: {
    mode: 'light',
    primary: { main: '#0284C7', light: '#38BDF8', dark: '#0369A1', contrastText: '#FFFFFF' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#FFFFFF' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626', contrastText: '#FFFFFF' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706', contrastText: '#FFFFFF' },
    info: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5', contrastText: '#FFFFFF' },
    success: { main: '#22C55E', light: '#4ADE80', dark: '#16A34A', contrastText: '#FFFFFF' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#475569', disabled: '#94A3B8' },
    divider: '#E2E8F0',
    tertiary: { main: '#F43F5E', light: '#FB7185', dark: '#E11D48', contrastText: '#FFFFFF' } as any,
    surface: { main: '#F8FAFC', contrastText: '#0F172A' } as any,
  } as any,
});

export const darkTheme = createTheme({
  ...sharedTheme,
  palette: {
    mode: 'dark',
    primary: { main: '#38BDF8', light: '#7DD3FC', dark: '#0284C7', contrastText: '#000000' },
    secondary: { main: '#34D399', light: '#6EE7B7', dark: '#10B981', contrastText: '#000000' },
    error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444', contrastText: '#000000' },
    warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B', contrastText: '#000000' },
    info: { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#000000' },
    success: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E', contrastText: '#000000' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F8FAFC', secondary: '#94A3B8', disabled: '#64748B' },
    divider: '#334155',
    tertiary: { main: '#FB7185', light: '#FDA4AF', dark: '#F43F5E', contrastText: '#000000' } as any,
    surface: { main: '#1E293B', contrastText: '#F8FAFC' } as any,
  } as any,
});




