"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BugReportIcon from "@mui/icons-material/BugReport";
import RefreshIcon from "@mui/icons-material/Refresh";
import ApiIcon from "@mui/icons-material/Api";
import StorageIcon from "@mui/icons-material/Storage";
import TranslateIcon from "@mui/icons-material/Translate";
import SpeedIcon from "@mui/icons-material/Speed";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GramBottomNav from "@/components/ui/GramBottomNav";
import toast from "react-hot-toast";
import axios from "axios";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "pending";
  message: string;
  duration?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TestPage() {
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([
    { name: "API Health Check", status: "pending", message: "Not tested" },
    { name: "Auth Service", status: "pending", message: "Not tested" },
    { name: "Scheme Service", status: "pending", message: "Not tested" },
    { name: "Document Service", status: "pending", message: "Not tested" },
    { name: "AI Chat Service", status: "pending", message: "Not tested" },
    { name: "Notification Service", status: "pending", message: "Not tested" },
    { name: "Database Connection", status: "pending", message: "Not tested" },
    { name: "Redis Cache", status: "pending", message: "Not tested" },
  ]);
  const [running, setRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_BASE);

  const runSingleTest = async (index: number) => {
    const test = results[index];
    setResults((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, status: "pending", message: "Running..." } : r,
      ),
    );

    const start = performance.now();
    try {
      let success = false;
      let msg = "";

      switch (index) {
        case 0: {
          const res = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
          success = res.status === 200;
          msg = success
            ? `OK (${res.status})`
            : `Unexpected status ${res.status}`;
          break;
        }
        case 1: {
          const res = await axios.get(`${apiUrl}/api/auth/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `Auth service reachable` : `Status ${res.status}`;
          break;
        }
        case 2: {
          const res = await axios.get(`${apiUrl}/api/schemes/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `Scheme service reachable` : `Status ${res.status}`;
          break;
        }
        case 3: {
          const res = await axios.get(`${apiUrl}/api/documents/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `Document service reachable` : `Status ${res.status}`;
          break;
        }
        case 4: {
          const res = await axios.get(`${apiUrl}/api/ai/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `AI chat service reachable` : `Status ${res.status}`;
          break;
        }
        case 5: {
          const res = await axios.get(`${apiUrl}/api/notifications/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success
            ? `Notification service reachable`
            : `Status ${res.status}`;
          break;
        }
        case 6: {
          const res = await axios.get(`${apiUrl}/api/db/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `Database connected` : `Status ${res.status}`;
          break;
        }
        case 7: {
          const res = await axios.get(`${apiUrl}/api/cache/health`, {
            timeout: 5000,
          });
          success = res.status === 200;
          msg = success ? `Redis reachable` : `Status ${res.status}`;
          break;
        }
      }

      const duration = Math.round(performance.now() - start);
      setResults((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                status: success ? "pass" : "fail",
                message: msg,
                duration,
              }
            : r,
        ),
      );
      if (success) {
        toast.success(`${test.name} passed (${duration}ms)`);
      } else {
        toast.error(`${test.name} failed: ${msg}`);
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setResults((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                status: "fail",
                message: err.message || "Request failed",
                duration,
              }
            : r,
        ),
      );
      toast.error(`${test.name}: ${err.message}`);
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    for (let i = 0; i < results.length; i++) {
      await runSingleTest(i);
    }
    setRunning(false);
    const passed = results.filter((r) => r.status === "pass").length;
    toast.success(`Tests complete: ${passed}/${results.length} passed`);
  };

  const resetTests = () => {
    setResults((prev) =>
      prev.map((r) => ({
        ...r,
        status: "pending" as const,
        message: "Not tested",
        duration: undefined,
      })),
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircleIcon sx={{ color: "success.main" }} />;
      case "fail":
        return <CancelIcon sx={{ color: "error.main" }} />;
      default:
        return <Box sx={{ width: 24, height: 24 }} />;
    }
  };

  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;

  return (
    <Box
      sx={{ minHeight: "100vh", pb: 12, backgroundColor: "background.default" }}
    >
      <Container maxWidth="lg" sx={{ px: 2, pt: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <BugReportIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={800}>
            Developer Testing Dashboard
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ borderRadius: 3, mb: 3 }}>
          <AlertTitle>Test Environment</AlertTitle>
          This dashboard runs live tests against the backend services. Ensure
          the API server is running before executing tests.
        </Alert>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <ApiIcon color="action" />
              <Typography variant="subtitle1" fontWeight={600}>
                API Endpoint
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<BugReportIcon />}
                onClick={runAllTests}
                disabled={running}
              >
                {running ? "Running..." : "Run All Tests"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={resetTests}
                disabled={running}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, bgcolor: "success.50" }}>
              <CardContent sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {passCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Passed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, bgcolor: "error.50" }}>
              <CardContent sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {failCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Failed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ borderRadius: 3, bgcolor: "grey.50" }}>
              <CardContent sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="text.secondary"
                >
                  {pendingCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {running && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>
                  <Typography fontWeight={600}>Test</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>Status</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>Message</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={600}>Duration</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={600}>Action</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((result, idx) => (
                <TableRow
                  key={result.name}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{getStatusIcon(result.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {result.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        result.status === "pass"
                          ? "PASS"
                          : result.status === "fail"
                            ? "FAIL"
                            : "PENDING"
                      }
                      size="small"
                      color={
                        result.status === "pass"
                          ? "success"
                          : result.status === "fail"
                            ? "error"
                            : "default"
                      }
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {result.status === "pending" ? "—" : result.message}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {result.duration ? `${result.duration}ms` : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={`Run ${result.name}`}>
                      <IconButton
                        size="small"
                        onClick={() => runSingleTest(idx)}
                        disabled={running}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <SpeedIcon color="action" />
              <Typography variant="subtitle1" fontWeight={600}>
                Environment Info
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Next.js Version
                </Typography>
                <Typography variant="body2">14.1.0</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  MUI Version
                </Typography>
                <Typography variant="body2">5.15.6</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  API Base URL
                </Typography>
                <Typography variant="body2">{apiUrl}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Build Time
                </Typography>
                <Typography variant="body2">
                  {new Date().toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
            mb: 4,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setShowDetails(!showDetails)}
            startIcon={showDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
          >
            {showDetails ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
          <Button variant="text" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </Box>

        {showDetails && (
          <Card sx={{ borderRadius: 3, mb: 3, bgcolor: "grey.900" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                color="grey.400"
                sx={{ mb: 1, fontFamily: "monospace" }}
              >
                Debug Output
              </Typography>
              <Box
                component="pre"
                sx={{
                  color: "success.light",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  overflow: "auto",
                  maxHeight: 400,
                  m: 0,
                }}
              >
                {JSON.stringify(
                  {
                    environment: process.env.NODE_ENV,
                    apiUrl,
                    results: results.map((r) => ({
                      name: r.name,
                      status: r.status,
                      message: r.message,
                      duration: r.duration,
                    })),
                    timestamp: new Date().toISOString(),
                    userAgent:
                      typeof window !== "undefined"
                        ? window.navigator.userAgent
                        : null,
                  },
                  null,
                  2,
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
      <GramBottomNav />
    </Box>
  );
}
