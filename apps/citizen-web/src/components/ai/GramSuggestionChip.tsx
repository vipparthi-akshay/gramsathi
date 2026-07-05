"use client";

import { motion, AnimatePresence } from "framer-motion";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

interface GramSuggestionChipProps {
  label: string;
  onClick: (label: string) => void;
  index?: number;
}

export default function GramSuggestionChip({
  label,
  onClick,
  index = 0,
}: GramSuggestionChipProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        style={{ display: "inline-block" }}
      >
        <Chip
          label={label}
          onClick={() => onClick(label)}
          variant="outlined"
          color="primary"
          sx={{
            borderRadius: 28,
            height: 36,
            fontSize: "0.875rem",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "primary.main",
              color: "primary.contrastText",
            },
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          }}
          aria-label={`Suggestion: ${label}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(label);
            }
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export function GramSuggestionRow({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (label: string) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        px: 2,
        py: 1,
        overflowX: "auto",
      }}
      role="list"
      aria-label="Quick suggestions"
    >
      {suggestions.map((suggestion, idx) => (
        <GramSuggestionChip
          key={`${suggestion}-${idx}`}
          label={suggestion}
          onClick={onSelect}
          index={idx}
        />
      ))}
    </Box>
  );
}
