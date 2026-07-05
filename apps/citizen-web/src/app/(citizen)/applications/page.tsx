"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import GramButton from "@/components/ui/GramButton";
import GramBottomNav from "@/components/ui/GramBottomNav";

const tabs = ["All", "Drafts", "Submitted", "Approved", "Rejected"];

const mockApps = [
  {
    id: "1",
    scheme: "PM Kisan Samman Nidhi",
    schemeLocal: "पीएम किसान सम्मान निधि",
    status: "under_review",
    progress: 65,
    date: "2026-03-15",
    timeline: [
      { status: "Submitted", date: "2026-03-15" },
      { status: "Documents Verified", date: "2026-03-20" },
      { status: "Under Review", date: "2026-03-25" },
    ],
  },
  {
    id: "2",
    scheme: "Ujjwala Yojana",
    schemeLocal: "उज्ज्वला योजना",
    status: "draft",
    progress: 30,
    date: "2026-04-01",
    timeline: [{ status: "Draft Created", date: "2026-04-01" }],
  },
  {
    id: "3",
    scheme: "PM Awas Yojana",
    schemeLocal: "पीएम आवास योजना",
    status: "approved",
    progress: 100,
    date: "2026-02-10",
    timeline: [
      { status: "Submitted", date: "2026-02-10" },
      { status: "Verified", date: "2026-02-20" },
      { status: "Approved", date: "2026-03-01" },
    ],
  },
  {
    id: "4",
    scheme: "PM Fasal Bima",
    schemeLocal: "पीएम फसल बीमा",
    status: "rejected",
    progress: 100,
    date: "2026-01-05",
    timeline: [
      { status: "Submitted", date: "2026-01-05" },
      { status: "Rejected", date: "2026-01-20" },
    ],
  },
];

const statusColors: Record<string, string> = {
  draft: "default",
  submitted: "info",
  under_review: "warning",
  approved: "success",
  rejected: "error",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const filteredApps =
    tab === 0
      ? mockApps
      : mockApps.filter((a) => a.status === tabs[tab].toLowerCase());

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 9, backgroundColor: "background.default" }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            My Applications
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton size="small" aria-label="Search applications">
              <SearchIcon />
            </IconButton>
            <IconButton size="small" aria-label="Filter applications">
              <FilterListIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
          aria-label="Application status tabs"
        >
          {tabs.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>

        {filteredApps.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No applications found
            </Typography>
            <GramButton
              variant="primary"
              onClick={() => router.push("/schemes")}
            >
              Browse Schemes
            </GramButton>
          </Box>
        ) : (
          filteredApps.map((app) => (
            <Card
              key={app.id}
              sx={{ borderRadius: 3, mb: 2, cursor: "pointer" }}
              onClick={() => router.push(`/applications/${app.id}`)}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {app.schemeLocal}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {app.scheme}
                    </Typography>
                  </Box>
                  <Chip
                    label={statusLabels[app.status] || app.status}
                    size="small"
                    color={(statusColors[app.status] as any) || "default"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={app.progress}
                  sx={{ borderRadius: 4, height: 6, mb: 1 }}
                  color={
                    (app.status === "rejected"
                      ? "error"
                      : app.status === "approved"
                        ? "success"
                        : "primary") as any
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  Last updated: {app.date}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Container>
      <GramBottomNav />
    </Box>
  );
}
