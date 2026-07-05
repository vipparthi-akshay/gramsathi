import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
  }
}

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Outfit", "Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontFamily: '"Inter", sans-serif', textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell:focus': { outline: 'none' },
        },
        columnHeaders: {
          backgroundColor: 'transparent',
          borderBottom: '2px solid',
        },
        row: {
          '&:nth-of-type(even)': { backgroundColor: 'action.hover' },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5', light: '#6366F1', dark: '#4338CA', contrastText: '#ffffff' },
    secondary: { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#ffffff' },
    tertiary: { main: '#F43F5E', light: '#FB7185', dark: '#E11D48' },
    error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
    warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
    info: { main: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
    success: { main: '#22C55E', light: '#4ADE80', dark: '#16A34A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#475569' },
    divider: '#E2E8F0',
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5', contrastText: '#ffffff' },
    secondary: { main: '#34D399', light: '#6EE7B7', dark: '#10B981', contrastText: '#000000' },
    tertiary: { main: '#FB7185', light: '#FDA4AF', dark: '#F43F5E' },
    error: { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
    warning: { main: '#FBBF24', light: '#FCD34D', dark: '#F59E0B' },
    info: { main: '#38BDF8', light: '#7DD3FC', dark: '#0EA5E9' },
    success: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F8FAFC', secondary: '#94A3B8' },
    divider: '#334155',
  },
});

export const chartColors = ['#1565C0', '#2E7D32', '#F57F17', '#C62828', '#0288D1', '#7B1FA2', '#E65100', '#00695C'];

export const statusColors: Record<string, string> = {
  pending: '#F57F17',
  under_review: '#1565C0',
  approved: '#2E7D32',
  rejected: '#C62828',
  escalated: '#E65100',
  resolved: '#2E7D32',
  closed: '#5A5A7A',
  active: '#2E7D32',
  inactive: '#5A5A7A',
  open: '#1565C0',
  verified: '#2E7D32',
  unverified: '#F57F17',
};

export type ThemeMode = 'light' | 'dark';
