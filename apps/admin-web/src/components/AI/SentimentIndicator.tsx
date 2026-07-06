import { Box, Typography, LinearProgress } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import MoodBadIcon from "@mui/icons-material/MoodBad";

interface SentimentIndicatorProps {
  sentiment: "positive" | "neutral" | "negative" | "angry";
  score: number;
  showLabel?: boolean;
  size?: "small" | "medium";
}

const sentimentConfig: Record<
  string,
  { icon: React.ReactElement; color: string; label: string }
> = {
  positive: {
    icon: <SentimentSatisfiedAltIcon />,
    color: "#2E7D32",
    label: "Positive",
  },
  neutral: {
    icon: <SentimentNeutralIcon />,
    color: "#F57F17",
    label: "Neutral",
  },
  negative: {
    icon: <SentimentDissatisfiedIcon />,
    color: "#C62828",
    label: "Negative",
  },
  angry: { icon: <MoodBadIcon />, color: "#B71C1C", label: "Angry" },
};

export default function SentimentIndicator({
  sentiment,
  score,
  showLabel = true,
  size = "medium",
}: SentimentIndicatorProps) {
  const config = sentimentConfig[sentiment] || sentimentConfig.neutral;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ color: config.color, display: "flex", alignItems: "center" }}>
        {config.icon}
      </Box>
      {showLabel && (
        <Box>
          <Typography
            variant={size === "small" ? "caption" : "body2"}
            sx={{ color: config.color, fontWeight: 600 }}
          >
            {config.label}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 80,
            }}
          >
            <LinearProgress
              variant="determinate"
              value={score * 100}
              sx={{
                height: 4,
                borderRadius: 2,
                flex: 1,
                backgroundColor: `${config.color}20`,
                "& .MuiLinearProgress-bar": { backgroundColor: config.color },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {Math.round(score * 100)}%
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
