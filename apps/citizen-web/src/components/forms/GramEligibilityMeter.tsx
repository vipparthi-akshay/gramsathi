'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const Gauge = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const GaugeSvg = styled('svg')({
  transform: 'rotate(-90deg)',
});

const GaugeText = styled(Typography)({
  position: 'absolute',
  fontWeight: 700,
});

interface EligibilityCriterion {
  label: string;
  met: boolean;
  weight: number;
}

interface GramEligibilityMeterProps {
  score: number;
  criteria: EligibilityCriterion[];
  size?: number;
}

export default function GramEligibilityMeter({
  score,
  criteria,
  size = 160,
}: GramEligibilityMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const scoreColor =
    score >= 80 ? '#2E7D32' : score >= 50 ? '#F57F17' : '#C62828';
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Gauge sx={{ width: size, height: size }}>
        <GaugeSvg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </GaugeSvg>
        <GaugeText variant="h4" sx={{ color: scoreColor }}>
          {animatedScore}%
        </GaugeText>
      </Gauge>

      <Typography variant="subtitle1" fontWeight={600}>
        {score >= 80
          ? 'You are eligible'
          : score >= 50
          ? 'Partially eligible'
          : 'Not eligible'}
      </Typography>

      <Box sx={{ width: '100%' }}>
        {criteria.map((criterion, idx) => (
          <Box key={idx} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{criterion.label}</Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color={criterion.met ? 'success.main' : 'error.main'}
              >
                {criterion.met ? '✓' : '✗'}
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                backgroundColor: 'grey.200',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${criterion.weight}%`,
                  height: '100%',
                  backgroundColor: criterion.met ? '#2E7D32' : '#C62828',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
