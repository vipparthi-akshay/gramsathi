import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Collapse,
  Chip,
  IconButton,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

interface AIRecommendationCardProps {
  recommendation: string;
  confidence: number;
  evidence?: string[];
  onAccept?: () => void;
  onOverride?: () => void;
  type?: 'approval' | 'review' | 'flag' | 'suggestion';
}

export default function AIRecommendationCard({
  recommendation,
  confidence,
  evidence,
  onAccept,
  onOverride,
  type = 'suggestion',
}: AIRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<string, string> = {
    approval: '#2E7D32',
    review: '#1565C0',
    flag: '#C62828',
    suggestion: '#F57F17',
  };

  const typeLabels: Record<string, string> = {
    approval: 'AI Approval Suggestion',
    review: 'AI Review Note',
    flag: 'AI Flagged',
    suggestion: 'AI Suggestion',
  };

  const color = typeColors[type] || '#1565C0';

  return (
    <Card sx={{ borderLeft: `4px solid ${color}`, mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AutoAwesomeIcon sx={{ color, fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color, fontWeight: 600 }}>
            {typeLabels[type]}
          </Typography>
          <Chip
            label={`${Math.round(confidence * 100)}% confidence`}
            size="small"
            sx={{
              backgroundColor: `${color}20`,
              color,
              fontWeight: 500,
              ml: 'auto',
            }}
          />
        </Box>

        <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
          {recommendation}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={confidence * 100}
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            '& .MuiLinearProgress-bar': { backgroundColor: color },
            mb: 1,
          }}
        />

        {evidence && evidence.length > 0 && (
          <>
            <Box
              onClick={() => setExpanded(!expanded)}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary' }}
            >
              <Typography variant="caption">Evidence & Details</Typography>
              <IconButton size="small" sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Box>
            <Collapse in={expanded}>
              <Box sx={{ pl: 1, mt: 0.5 }}>
                {evidence.map((e, i) => (
                  <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                    • {e}
                  </Typography>
                ))}
              </Box>
            </Collapse>
          </>
        )}

        {(onAccept || onOverride) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            {onAccept && (
              <Button size="small" variant="contained" startIcon={<ThumbUpIcon />} onClick={onAccept} sx={{ backgroundColor: color }}>
                Accept
              </Button>
            )}
            {onOverride && (
              <Button size="small" variant="outlined" startIcon={<ThumbDownIcon />} onClick={onOverride} color="error">
                Override
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
