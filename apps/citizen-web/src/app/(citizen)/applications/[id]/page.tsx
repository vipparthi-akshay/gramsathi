"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import GramButton from "@/components/ui/GramButton";
import GramBottomNav from "@/components/ui/GramBottomNav";

const timelineData = [
  {
    status: "Application Submitted",
    date: "March 15, 2026",
    remarks: "Application received successfully",
  },
  {
    status: "Documents Verified",
    date: "March 20, 2026",
    remarks: "All documents verified",
  },
  {
    status: "Under Review",
    date: "March 25, 2026",
    remarks: "Application is being processed by department",
  },
  {
    status: "Awaiting Approval",
    date: "Expected by April 15",
    remarks: "Final approval pending",
  },
];

export default function ApplicationDetailPage() {
  const router = useRouter();

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 9, backgroundColor: "background.default" }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Application Details
          </Typography>
          <IconButton aria-label="Share">
            <ShareIcon />
          </IconButton>
        </Box>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  PM Kisan Samman Nidhi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  पीएम किसान सम्मान निधि
                </Typography>
              </Box>
              <Chip label="Under Review" color="warning" size="small" />
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Chip
                icon={<DescriptionIcon />}
                label="App #: KS-2026-00421"
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Status Timeline
        </Typography>

        <Box sx={{ mb: 3 }}>
          {timelineData.map((item, idx) => (
            <Box key={idx} sx={{ display: "flex", gap: 2, minHeight: 72 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 32,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      idx < timelineData.length - 1
                        ? "primary.main"
                        : "action.disabledBackground",
                    color:
                      idx < timelineData.length - 1
                        ? "primary.contrastText"
                        : "text.disabled",
                  }}
                >
                  {idx < timelineData.length - 1 ? (
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                  )}
                </Box>
                {idx < timelineData.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 40,
                      bgcolor: "divider",
                      my: 0.5,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ pb: idx < timelineData.length - 1 ? 2 : 0, flex: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ fontSize: "0.9rem" }}
                >
                  {item.status}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.date}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.82rem", mt: 0.25 }}
                >
                  {item.remarks}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Submitted Documents
            </Typography>
            {["Aadhaar Card", "Income Certificate", "Bank Passbook"].map(
              (doc, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Chip
                    label="✓ Verified"
                    size="small"
                    color="success"
                    sx={{ minWidth: 80 }}
                  />
                  <Typography variant="body2">{doc}</Typography>
                </Box>
              ),
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 1 }}>
          <GramButton
            variant="outlined"
            fullWidth
            onClick={() => router.back()}
          >
            Go Back
          </GramButton>
          <GramButton
            variant="primary"
            fullWidth
            onClick={() => router.push("/ai")}
          >
            Ask GramBot
          </GramButton>
        </Box>
      </Container>
      <GramBottomNav />
    </Box>
  );
}
