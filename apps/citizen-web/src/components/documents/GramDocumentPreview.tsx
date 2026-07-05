"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import GramCard from "@/components/ui/GramCard";

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface GramDocumentPreviewProps {
  thumbnail: string;
  documentType: string;
  status: "verified" | "pending" | "rejected" | "needs_review";
  fields: ExtractedField[];
  onEditField?: (fieldLabel: string) => void;
}

const statusConfig = {
  verified: { icon: CheckCircleIcon, color: "success.main", label: "Verified" },
  pending: { icon: WarningIcon, color: "warning.main", label: "Pending" },
  rejected: { icon: ErrorIcon, color: "error.main", label: "Rejected" },
  needs_review: {
    icon: WarningIcon,
    color: "warning.main",
    label: "Needs Review",
  },
};

export default function GramDocumentPreview({
  thumbnail,
  documentType,
  status,
  fields,
  onEditField,
}: GramDocumentPreviewProps) {
  const StatusIcon = statusConfig[status].icon;

  return (
    <GramCard ariaLabel={`Document preview - ${documentType}`}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box
          sx={{
            width: 100,
            height: 120,
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "grey.200",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src={thumbnail}
            alt={documentType}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {documentType}
            </Typography>
            <Chip
              icon={<StatusIcon sx={{ fontSize: 16 }} />}
              label={statusConfig[status].label}
              size="small"
              sx={{
                backgroundColor: `${statusConfig[status].color}20`,
                color: statusConfig[status].color,
                fontWeight: 600,
              }}
            />
          </Box>
          {fields.map((field) => (
            <Box
              key={field.label}
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 80 }}
              >
                {field.label}:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {field.value}
              </Typography>
              {field.confidence < 80 && (
                <Chip
                  label={`${field.confidence}%`}
                  size="small"
                  color={field.confidence < 50 ? "error" : "warning"}
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              )}
              {onEditField && status === "needs_review" && (
                <IconButton
                  size="small"
                  onClick={() => onEditField(field.label)}
                  aria-label={`Edit ${field.label}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </GramCard>
  );
}
