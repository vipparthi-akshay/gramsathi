import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import GramTable from "@/components/Data/GramTable";
import GramFilterBar from "@/components/Data/GramFilterBar";
import StatusBadge from "@/components/Data/StatusBadge";
import { useFilters } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import type { Application, ApplicationStatus } from "@/services/applications";
import { saveAs } from "file-saver";

const mockApplications: Application[] = Array.from({ length: 45 }, (_, i) => ({
  id: `APP-${String(i + 1).padStart(3, "0")}`,
  citizenId: `CIT-${1000 + i}`,
  citizenName: [
    "Ramesh Singh",
    "Sita Devi",
    "Mohan Lal",
    "Geeta Verma",
    "Arun Kumar",
    "Priya Patel",
    "Vikram Sharma",
    "Anita Desai",
    "Suresh Reddy",
    "Lakshmi Nair",
  ][i % 10],
  citizenPhone: `987654${String(3000 + i).slice(0, 4)}`,
  schemeId: `SCH-${(i % 4) + 1}`,
  schemeName: [
    "Kisan Samman Yojana",
    "PM Awas Yojana",
    "Shiksha Protsahan",
    "Swasthya Raksha",
  ][i % 4],
  status: (
    [
      "pending",
      "under_review",
      "approved",
      "rejected",
      "info_required",
    ] as ApplicationStatus[]
  )[i % 5],
  submittedAt: new Date(2024, 0, 15 - Math.floor(i / 3)).toISOString(),
  documents: [],
}));

const tabs = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Info Required", value: "info_required" },
];

export default function Applications() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useFilters();
  const debouncedSearch = useDebounce(filters.search);
  const { page, limit, total, setTotal, setPage, setLimit } = usePagination(10);
  const [activeTab, setActiveTab] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let filtered = [...mockApplications];
    if (activeTab) {
      filtered = filtered.filter((a) => a.status === activeTab);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.citizenName.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.schemeName.toLowerCase().includes(q),
      );
    }
    if (filters.status) {
      filtered = filtered.filter((a) => a.status === filters.status);
    }
    setTotal(filtered.length);
    const start = (page - 1) * limit;
    setApplications(filtered.slice(start, start + limit));
  }, [activeTab, debouncedSearch, filters.status, page, limit, setTotal]);

  const handleBulkApprove = () => {
    setBulkDialog(true);
  };

  const confirmBulkApprove = () => {
    setApplications((prev) =>
      prev.map((a) =>
        selected.includes(a.id)
          ? { ...a, status: "approved" as ApplicationStatus }
          : a,
      ),
    );
    setSelected([]);
    setBulkDialog(false);
  };

  const handleApprove = (app: Application) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id ? { ...a, status: "approved" as ApplicationStatus } : a,
      ),
    );
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    setApplications((prev) =>
      prev.map((a) =>
        a.id === rejectDialog.id
          ? { ...a, status: "rejected" as ApplicationStatus }
          : a,
      ),
    );
    setRejectDialog(null);
    setRejectReason("");
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Citizen", "Scheme", "Status", "Date"].join(","),
      ...applications.map((a) =>
        [
          a.id,
          a.citizenName,
          a.schemeName,
          a.status,
          new Date(a.submittedAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "applications.csv");
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
            Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process and review scheme applications
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {selected.length > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleBulkApprove}
            >
              Approve ({selected.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
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
        placeholder="Search by name, ID or scheme..."
      />

      <Box sx={{ mt: 2 }}>
        <GramTable
          columns={[
            {
              id: "id",
              label: "Application ID",
              render: (row: Application) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.id}
                </Typography>
              ),
              sortable: true,
            },
            {
              id: "citizen",
              label: "Citizen",
              render: (row: Application) => (
                <Box>
                  <Typography variant="body2">{row.citizenName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.citizenPhone}
                  </Typography>
                </Box>
              ),
            },
            {
              id: "scheme",
              label: "Scheme",
              render: (row: Application) => row.schemeName,
              sortable: true,
            },
            {
              id: "date",
              label: "Submitted",
              render: (row: Application) =>
                new Date(row.submittedAt).toLocaleDateString(),
              sortable: true,
            },
            {
              id: "status",
              label: "Status",
              render: (row: Application) => <StatusBadge status={row.status} />,
            },
          ]}
          data={applications}
          keyExtractor={(row) => row.id}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          selectable
          selected={selected}
          onSelectionChange={setSelected}
          onExport={handleExport}
          actions={(row: Application) => (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/applications/${row.id}`)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  onClick={() => handleApprove(row)}
                  color="success"
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  onClick={() => setRejectDialog(row)}
                  color="error"
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        />
      </Box>

      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)}>
        <DialogTitle>Bulk Approve Applications</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve {selected.length} selected
            applications?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmBulkApprove}
            color="success"
            variant="contained"
          >
            Approve All
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!rejectDialog}
        onClose={() => setRejectDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Rejecting application from{" "}
            <strong>{rejectDialog?.citizenName}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Reason for rejection"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(null)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectReason}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
