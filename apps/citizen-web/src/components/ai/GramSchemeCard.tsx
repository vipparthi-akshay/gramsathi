"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import ShareIcon from "@mui/icons-material/Share";
import { styled } from "@mui/material/styles";
import GramCard from "@/components/ui/GramCard";
import GramButton from "@/components/ui/GramButton";

const MatchBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 28,
  backgroundColor:
    (theme.palette as any).primaryContainer || "rgba(21, 101, 192, 0.1)",
  width: "fit-content",
}));

interface GramSchemeCardProps {
  name: string;
  nameLocal: string;
  matchScore: number;
  benefits: string[];
  deadline?: string;
  category?: string;
  onApply?: () => void;
  onKnowMore?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
}

export default function GramSchemeCard({
  name,
  nameLocal,
  matchScore,
  benefits,
  deadline,
  category,
  onApply,
  onKnowMore,
  onShare,
  isSaved,
}: GramSchemeCardProps) {
  const scoreColor =
    matchScore >= 80
      ? "success.main"
      : matchScore >= 50
        ? "warning.main"
        : "error.main";

  return (
    <GramCard
      elevation={1}
      ariaLabel={`Scheme: ${nameLocal}`}
      actions={
        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <GramButton variant="primary" size="small" onClick={onApply}>
            Apply Now
          </GramButton>
          <GramButton variant="outlined" size="small" onClick={onKnowMore}>
            Know More
          </GramButton>
          {onShare && (
            <IconButton
              size="small"
              onClick={onShare}
              aria-label="Share scheme"
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {nameLocal}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {name}
          </Typography>
        </Box>
        <Box sx={{ position: "relative", display: "inline-flex", ml: 1 }}>
          <CircularProgress
            variant="determinate"
            value={matchScore}
            size={48}
            thickness={4}
            sx={{ color: scoreColor }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" fontWeight={700} fontSize="0.7rem">
              {matchScore}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {category && (
        <Chip label={category} size="small" sx={{ mb: 1, borderRadius: 28 }} />
      )}

      {benefits.length > 0 && (
        <Box sx={{ mb: 1 }}>
          {benefits.slice(0, 2).map((b, i) => (
            <Typography
              key={i}
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8rem" }}
            >
              • {b}
            </Typography>
          ))}
        </Box>
      )}

      {deadline && (
        <Typography
          variant="caption"
          color="error.main"
          sx={{ fontWeight: 600 }}
        >
          Deadline: {deadline}
        </Typography>
      )}
    </GramCard>
  );
}
