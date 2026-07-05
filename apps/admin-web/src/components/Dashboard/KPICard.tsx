import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: number;
  trend: number;
  trendDirection: 'up' | 'down';
  icon: string;
  color: string;
  onClick?: () => void;
}

function formatValue(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('en-IN');
}

export default function KPICard({ label, value, trend, trendDirection, icon, color, onClick }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': { boxShadow: '0px 4px 16px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' },
          transition: 'all 0.2s ease',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {formatValue(value)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {trendDirection === 'up' ? (
                  <TrendingUpIcon sx={{ color: '#2E7D32', fontSize: 18 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#C62828', fontSize: 18 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: trendDirection === 'up' ? '#2E7D32' : '#C62828',
                  }}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
                <Typography variant="caption" color="text.secondary">vs last month</Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-icons" style={{ color, fontSize: 24 }}>{icon}</span>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
