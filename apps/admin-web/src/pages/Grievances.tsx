import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import GramTable from "@/components/Data/GramTable";
import GramFilterBar from "@/components/Data/GramFilterBar";
import StatusBadge from "@/components/Data/StatusBadge";
import SentimentIndicator from "@/components/AI/SentimentIndicator";
import { useFilters } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  Grievance,
  GrievanceStatus,
  SentimentType,
} from "@/services/grievances";

const mockGrievances: Grievance[] = Array.from({ length: 35 }, (_, i) => ({
  id: `GRV-${String(i + 1).padStart(3, "0")}`,
  citizenId: `CIT-${1000 + i}`,
  citizenName: [
    "Ramesh Singh",
    "Sita Devi",
    "Mohan Lal",
    "Geeta Verma",
    "Arun Kumar",
  ][i % 5],
  citizenPhone: `987654${String(3000 + i).slice(0, 4)}`,
  category: [
    "Water Supply",
    "Electricity",
    "Road",
    "Housing",
    "Health",
    "Education",
    "Pension",
  ][i % 7],
  department: [
    "Public Works",
    "Electricity Board",
    "Municipality",
    "Health Dept",
    "Education Dept",
  ][i % 5],
  description: "Issue with basic amenities in the village",
  status: (["open", "escalated", "resolved", "closed"] as GrievanceStatus[])[
    i % 4
  ],
  sentiment: (["positive", "neutral", "negative", "angry"] as SentimentType[])[
    i % 4
  ],
  sentimentScore: 0.3 + Math.random() * 0.6,
  priority: (["low", "medium", "high", "critical"] as const)[i % 4],
  assignedTo: i % 3 === 0 ? `OFF-${(i % 5) + 1}` : undefined,
  assignedToName:
    i % 3 === 0
      ? ["Priya Sharma", "Amit Kumar", "Sneha Patel"][i % 3]
      : undefined,
  createdAt: new Date(2024, 0, 20 - Math.floor(i / 2)).toISOString(),
  updatedAt: new Date().toISOString(),
  trackingEntries: [],
}));

const tabs = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "Escalated", value: "escalated" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const priorityColors: Record<string, string> = {
  low: "#2E7D32",
  medium: "#F57F17",
  high: "#C62828",
  critical: "#B71C1C",
};

const officers = ["Priya Sharma", "Amit Kumar", "Sneha Patel", "Vijay Singh"];

export default function Grievances() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useFilters();
  const debouncedSearch = useDebounce(filters.search);
  const { page, limit, total, setTotal, setPage, setLimit } = usePagination(10);
  const [activeTab, setActiveTab] = useState("");
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [assignMenu, setAssignMenu] = useState<{
    anchor: HTMLElement;
    grievance: Grievance;
  } | null>(null);

  useEffect(() => {
    let filtered = [...mockGrievances];
    if (activeTab) filtered = filtered.filter((g) => g.status === activeTab);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.citizenName.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q),
      );
    }
    if (filters.department)
      filtered = filtered.filter((g) =>
        g.department.toLowerCase().includes(filters.department.toLowerCase()),
      );
    setTotal(filtered.length);
    const start = (page - 1) * limit;
    setGrievances(filtered.slice(start, start + limit));
  }, [activeTab, debouncedSearch, filters.department, page, limit, setTotal]);

  const handleAssign = (officer: string) => {
    if (!assignMenu) return;
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === assignMenu.grievance.id
          ? { ...g, assignedTo: officer, assignedToName: officer }
          : g,
      ),
    );
    setAssignMenu(null);
  };

  const handleEscalate = (grievance: Grievance) => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === grievance.id
          ? { ...g, status: "escalated" as GrievanceStatus }
          : g,
      ),
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Grievances
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track citizen grievances
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => {
          setActiveTab(v);
          setPage(1);
        }}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      <GramFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
        placeholder="Search by citizen, ID or category..."
      />

      <Box sx={{ mt: 2 }}>
        <GramTable
          columns={[
            {
              id: "id",
              label: "ID",
              render: (row: Grievance) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.id}
                </Typography>
              ),
            },
            {
              id: "citizen",
              label: "Citizen",
              render: (row: Grievance) => (
                <Box>
                  <Typography variant="body2">{row.citizenName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.citizenPhone}
                  </Typography>
                </Box>
              ),
            },
            {
              id: "category",
              label: "Category",
              render: (row: Grievance) => row.category,
            },
            {
              id: "department",
              label: "Department",
              render: (row: Grievance) => row.department,
            },
            {
              id: "sentiment",
              label: "Sentiment",
              render: (row: Grievance) => (
                <SentimentIndicator
                  sentiment={row.sentiment}
                  score={row.sentimentScore}
                  size="small"
                />
              ),
            },
            {
              id: "priority",
              label: "Priority",
              render: (row: Grievance) => (
                <Chip
                  label={row.priority}
                  size="small"
                  sx={{
                    backgroundColor: `${priorityColors[row.priority]}20`,
                    color: priorityColors[row.priority],
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                />
              ),
            },
            {
              id: "status",
              label: "Status",
              render: (row: Grievance) => <StatusBadge status={row.status} />,
            },
          ]}
          data={grievances}
          keyExtractor={(row) => row.id}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          actions={(row: Grievance) => (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/grievances/${row.id}`)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Assign">
                <IconButton
                  size="small"
                  onClick={(e) =>
                    setAssignMenu({ anchor: e.currentTarget, grievance: row })
                  }
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {row.status !== "escalated" && (
                <Button
                  size="small"
                  color="warning"
                  onClick={() => handleEscalate(row)}
                >
                  Escalate
                </Button>
              )}
            </Box>
          )}
        />
      </Box>

      <Menu
        anchorEl={assignMenu?.anchor}
        open={Boolean(assignMenu)}
        onClose={() => setAssignMenu(null)}
      >
        {officers.map((o) => (
          <MenuItem
            key={o}
            onClick={() => handleAssign(o)}
            selected={assignMenu?.grievance.assignedToName === o}
          >
            {o}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
