import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import KPICard from "@/components/Dashboard/KPICard";
import AIInsightsPanel from "@/components/Dashboard/AIInsightsPanel";
import GeoHeatMap from "@/components/Dashboard/GeoHeatMap";
import StatusBadge from "@/components/Data/StatusBadge";
import { useDashboardStore } from "@/store/dashboardStore";
import type { KPI } from "@/store/dashboardStore";

const pendingApplications = [
  {
    id: "APP-001",
    citizen: "Ramesh Singh",
    scheme: "Kisan Samman Yojana",
    submitted: "2024-01-15",
    status: "pending",
  },
  {
    id: "APP-002",
    citizen: "Sita Devi",
    scheme: "PM Awas Yojana",
    submitted: "2024-01-14",
    status: "under_review",
  },
  {
    id: "APP-003",
    citizen: "Mohan Lal",
    scheme: "Shiksha Protsahan",
    submitted: "2024-01-13",
    status: "pending",
  },
  {
    id: "APP-004",
    citizen: "Geeta Verma",
    scheme: "Kisan Samman Yojana",
    submitted: "2024-01-12",
    status: "info_required",
  },
  {
    id: "APP-005",
    citizen: "Arun Kumar",
    scheme: "PM Awas Yojana",
    submitted: "2024-01-11",
    status: "pending",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { kpis, trendData, fetchOverview, fetchTrends, loading } =
    useDashboardStore();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [animateKpis, setAnimateKpis] = useState(false);

  useEffect(() => {
    fetchOverview();
    fetchTrends();
    setTimeout(() => setAnimateKpis(true), 300);
  }, [fetchOverview, fetchTrends]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOverview(), fetchTrends()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time overview of GramSathi AI platform
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/schemes/new")}
          >
            New Scheme
          </Button>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <KPICard
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              trendDirection={kpi.trendDirection}
              icon={kpi.icon}
              color={kpi.color}
              onClick={
                kpi.label === "Pending Review"
                  ? () => navigate("/applications")
                  : undefined
              }
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Application Trends (7 Days)
                </Typography>
                <Chip label="Weekly" size="small" />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    trendData.length > 0
                      ? trendData
                      : [
                          {
                            date: "Mon",
                            applications: 120,
                            approvals: 65,
                            rejections: 12,
                          },
                          {
                            date: "Tue",
                            applications: 95,
                            approvals: 72,
                            rejections: 8,
                          },
                          {
                            date: "Wed",
                            applications: 145,
                            approvals: 88,
                            rejections: 15,
                          },
                          {
                            date: "Thu",
                            applications: 110,
                            approvals: 54,
                            rejections: 10,
                          },
                          {
                            date: "Fri",
                            applications: 135,
                            approvals: 92,
                            rejections: 18,
                          },
                          {
                            date: "Sat",
                            applications: 85,
                            approvals: 45,
                            rejections: 5,
                          },
                          {
                            date: "Sun",
                            applications: 70,
                            approvals: 38,
                            rejections: 3,
                          },
                        ]
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Applications"
                  />
                  <Line
                    type="monotone"
                    dataKey="approvals"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Approvals"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejections"
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Rejections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pending Applications
                </Typography>
                <Button size="small" onClick={() => navigate("/applications")}>
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Citizen</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Scheme</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingApplications.map((app) => (
                      <TableRow
                        key={app.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {app.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{app.citizen}</TableCell>
                        <TableCell>{app.scheme}</TableCell>
                        <TableCell>{app.submitted}</TableCell>
                        <TableCell>
                          <StatusBadge status={app.status} />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/${app.id}`);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <AIInsightsPanel />
            <GeoHeatMap />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
