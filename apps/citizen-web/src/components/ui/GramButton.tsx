'use client';

import { forwardRef, ReactNode, MouseEvent } from 'react';
import MuiButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme }) => ({
  position: 'relative',
  '& .MuiCircularProgress-root': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  '&.GramButton-tonal': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(46, 125, 50, 0.24)'
      : 'rgba(46, 125, 50, 0.12)',
    color: theme.palette.secondary.main,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(46, 125, 50, 0.36)'
        : 'rgba(46, 125, 50, 0.20)',
    },
  },
  '&.GramButton-fab': {
    borderRadius: '50%',
    minWidth: 64,
    width: 64,
    height: 64,
    padding: 0,
    boxShadow: '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px 0px rgba(0,0,0,0.30)',
  },
}));

interface GramButtonProps {
  variant?: 'primary' | 'secondary' | 'tonal' | 'outlined' | 'text' | 'fab';
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  className?: string;
  sx?: any;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const variantMap: Record<string, any> = {
  primary: 'contained',
  secondary: 'contained',
  tonal: 'tonal',
  outlined: 'outlined',
  text: 'text',
  fab: 'contained',
};

const colorMap: Record<string, any> = {
  primary: 'primary',
  secondary: 'secondary',
  tonal: 'secondary',
  outlined: 'primary',
  text: 'primary',
  fab: 'primary',
};

const GramButton = forwardRef<HTMLButtonElement, GramButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      icon,
      loading = false,
      fullWidth = false,
      disabled = false,
      children,
      onClick,
      type = 'button',
      ariaLabel,
      ariaExpanded,
      ariaControls,
      className,
      sx,
      color,
    },
    ref
  ) => {
    const muiVariant = variant === 'fab' ? 'contained' : variantMap[variant];
    const muiColor = color || colorMap[variant];

    return (
      <StyledButton
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        size={size}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        onClick={onClick}
        type={type}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-busy={loading}
        className={`${className || ''} ${variant === 'tonal' ? 'GramButton-tonal' : ''} ${variant === 'fab' ? 'GramButton-fab' : ''}`}
        startIcon={!loading && icon ? icon : undefined}
        sx={sx}
      >
        {loading && <CircularProgress size={24} color="inherit" />}
        <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
          {children}
        </span>
      </StyledButton>
    );
  }
);

GramButton.displayName = 'GramButton';

export default GramButton;
