import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import WarningIcon from "@mui/icons-material/Warning";
import SentimentIndicator from "@/components/AI/SentimentIndicator";
import StatusBadge from "@/components/Data/StatusBadge";

const mockGrievance = {
  id: "GRV-001",
  citizenName: "Ramesh Singh",
  citizenPhone: "+91-9876543210",
  citizenAddress: "Village Purwa, Lucknow, UP",
  category: "Water Supply",
  department: "Public Works Department",
  description:
    "There is no water supply in our village for the past 15 days. The handpumps are dry and the tanker supply has stopped. We have filed multiple complaints but no action has been taken. The villagers are facing severe water shortage.",
  aiDraft:
    "The citizen reports a 15-day disruption in water supply in Village Purwa. Multiple complaints have been filed without resolution. This indicates a systemic issue requiring immediate intervention from the Public Works Department.",
  status: "open",
  sentiment: "angry" as "positive" | "neutral" | "negative" | "angry",
  sentimentScore: 0.82,
  priority: "high",
  assignedTo: "Not assigned",
  createdAt: "2024-01-20",
  trackingEntries: [
    {
      id: "1",
      action: "Grievance Filed",
      note: "Filed via citizen portal",
      performedBy: "system",
      performedByName: "Ramesh Singh",
      timestamp: "2024-01-20 09:30 AM",
    },
    {
      id: "2",
      action: "Verified",
      note: "Complaint verified by AI system",
      performedBy: "system",
      performedByName: "AI System",
      timestamp: "2024-01-20 09:35 AM",
    },
  ],
};

export default function GrievanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resolution, setResolution] = useState("");
  const [status, setStatus] = useState(mockGrievance.status);
  const [tracking, setTracking] = useState(mockGrievance.trackingEntries);

  const handleResolve = () => {
    if (!resolution.trim()) return;
    const entry = {
      id: String(Date.now()),
      action: "Resolved",
      note: resolution,
      performedBy: "officer",
      performedByName: "Current Officer",
      timestamp: new Date().toLocaleString(),
    };
    setTracking([...tracking, entry]);
    setStatus("resolved");
    setResolution("");
  };

  const handleEscalate = () => {
    const entry = {
      id: String(Date.now()),
      action: "Escalated",
      note: "Escalated to higher authority for resolution",
      performedBy: "officer",
      performedByName: "Current Officer",
      timestamp: new Date().toLocaleString(),
    };
    setTracking([...tracking, entry]);
    setStatus("escalated");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/grievances")}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Grievance Detail
            </Typography>
            <StatusBadge status={status} size="medium" />
            <Chip
              label={mockGrievance.priority}
              size="small"
              color="error"
              sx={{ textTransform: "capitalize" }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {id} • {mockGrievance.category}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Citizen Information
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>RS</Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {mockGrievance.citizenName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mockGrievance.citizenPhone}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {mockGrievance.citizenAddress}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Grievance Description
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "action.hover",
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Typography variant="body2">
                  {mockGrievance.description}
                </Typography>
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "primary.main", mb: 1 }}
              >
                <SendIcon
                  fontSize="small"
                  sx={{ mr: 0.5, verticalAlign: "middle" }}
                />
                AI Draft
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  borderRadius: 2,
                  opacity: 0.9,
                }}
              >
                <Typography variant="body2">{mockGrievance.aiDraft}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tracking Timeline
              </Typography>
              <List dense>
                {tracking.map((entry, idx) => (
                  <ListItem key={entry.id} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor:
                            idx === 0 ? "primary.main" : "grey.400",
                          border: "2px solid",
                          borderColor: idx === 0 ? "primary.light" : "grey.300",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {entry.action}
                          </Typography>
                          <Chip
                            label={entry.performedByName}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: 10 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {entry.timestamp}
                          </Typography>
                          {entry.note && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {entry.note}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                AI Sentiment Analysis
              </Typography>
              <SentimentIndicator
                sentiment={mockGrievance.sentiment}
                score={mockGrievance.sentimentScore}
                size="medium"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                This grievance has been flagged as high priority due to the
                urgent nature of the water supply issue and the citizen's
                frustration level.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Details
              </Typography>
              <Box sx={{ "& > div": { mb: 1.5 } }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mockGrievance.category}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Department
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mockGrievance.department}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Assigned To
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mockGrievance.assignedTo}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Filed On
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mockGrievance.createdAt}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {status === "open" && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Resolution
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Describe the resolution or action taken..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleResolve}
                  disabled={!resolution.trim()}
                  sx={{ mb: 1 }}
                >
                  Mark as Resolved
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={handleEscalate}
                >
                  Escalate to Higher Authority
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
