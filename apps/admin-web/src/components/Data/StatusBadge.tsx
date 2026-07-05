import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import FlagIcon from '@mui/icons-material/Flag';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { statusColors } from '@/theme/theme';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusIcons: Record<string, React.ReactElement> = {
  pending: <HourglassEmptyIcon />,
  under_review: <FlagIcon />,
  approved: <CheckCircleIcon />,
  rejected: <CancelIcon />,
  escalated: <NewReleasesIcon />,
  resolved: <CheckCircleIcon />,
  closed: <CancelIcon />,
  active: <CheckCircleIcon />,
  inactive: <CancelIcon />,
  open: <ErrorIcon />,
  verified: <CheckCircleIcon />,
  unverified: <ErrorIcon />,
};

function formatLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const color = statusColors[status] || '#5A5A7A';

  return (
    <Chip
      icon={statusIcons[status] || <FlagIcon />}
      label={formatLabel(status)}
      size={size}
      sx={{
        backgroundColor: `${color}18`,
        color: color,
        fontWeight: 500,
        border: `1px solid ${color}40`,
        '& .MuiChip-icon': { color: color, fontSize: size === 'small' ? 16 : 20 },
      }}
    />
  );
}
