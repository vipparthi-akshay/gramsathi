import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface AIInsight {
  type: "approval" | "anomaly" | "trend";
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
}

const insights: AIInsight[] = [
  {
    type: "approval",
    title: "Auto-Approval Suggestions",
    description: "Eligible applications ready for auto-approval",
    count: 47,
    actionLabel: "Review",
  },
  {
    type: "anomaly",
    title: "Anomaly Detected",
    description: "Unusual application pattern in PM Kisan scheme",
    count: 3,
    actionLabel: "Investigate",
  },
  {
    type: "trend",
    title: "Trend Alert",
    description: "40% increase in scheme applications this week",
    actionLabel: "View Report",
  },
];

const typeIcons: Record<string, React.ReactElement> = {
  approval: <AutoAwesomeIcon sx={{ color: "#1565C0" }} />,
  anomaly: <WarningAmberIcon sx={{ color: "#C62828" }} />,
  trend: <TrendingUpIcon sx={{ color: "#2E7D32" }} />,
};

export default function AIInsightsPanel() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AutoAwesomeIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI Insights
          </Typography>
          <Chip label="Live" size="small" color="success" sx={{ ml: "auto" }} />
        </Box>

        {insights.map((insight, idx) => (
          <Box key={idx}>
            <Box sx={{ display: "flex", gap: 1.5, py: 1.5 }}>
              <Box sx={{ mt: 0.3 }}>{typeIcons[insight.type]}</Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {insight.title}
                  </Typography>
                  {insight.count && (
                    <Chip
                      label={insight.count}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {insight.description}
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 0.5, p: 0, fontSize: 12 }}
                >
                  {insight.actionLabel}
                </Button>
              </Box>
            </Box>
            {idx < insights.length - 1 && <Divider />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
