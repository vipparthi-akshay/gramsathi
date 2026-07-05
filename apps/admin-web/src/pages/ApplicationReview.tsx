import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AIRecommendationCard from '@/components/AI/AIRecommendationCard';
import StatusBadge from '@/components/Data/StatusBadge';

const mockApplication = {
  id: 'APP-001',
  citizen: {
    name: 'Ramesh Singh',
    phone: '+91-9876543210',
    aadhaar: 'XXXX-XXXX-1234',
    age: 42,
    gender: 'Male',
    address: 'Village Purwa, Block Sadar, District Lucknow, Uttar Pradesh',
    isVerified: true,
  },
  scheme: {
    name: 'Kisan Samman Yojana',
    category: 'Agriculture',
    department: 'Ministry of Agriculture',
    budget: '₹6,000/year',
  },
  status: 'pending',
  submittedAt: '2024-01-15',
  documents: [
    { id: '1', name: 'Aadhaar Card', type: 'identity', url: '#', verified: true, verifiedAt: '2024-01-16', verifiedBy: 'AI System' },
    { id: '2', name: 'Land Records', type: 'property', url: '#', verified: true, verifiedAt: '2024-01-16', verifiedBy: 'AI System' },
    { id: '3', name: 'Bank Passbook', type: 'financial', url: '#', verified: false },
    { id: '4', name: 'Income Certificate', type: 'financial', url: '#', verified: false },
  ],
  timeline: [
    { action: 'Application Submitted', date: '2024-01-15 09:30 AM', by: 'Citizen' },
    { action: 'Aadhaar Verified', date: '2024-01-16 10:15 AM', by: 'AI System' },
    { action: 'Land Records Verified', date: '2024-01-16 10:18 AM', by: 'AI System' },
    { action: 'Under Review', date: '2024-01-16 11:00 AM', by: 'System' },
  ],
};

export default function ApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(mockApplication.status);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'info') => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (action === 'approve') setStatus('approved');
    else if (action === 'reject') setStatus('rejected');
    else setStatus('info_required');
    setActionLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/applications')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Application Review</Typography>
            <StatusBadge status={status} size="medium" />
          </Box>
          <Typography variant="body2" color="text.secondary">{id} • Submitted on {mockApplication.submittedAt}</Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Citizen Profile</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: 18 }}>
                      {mockApplication.citizen.name.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{mockApplication.citizen.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{mockApplication.citizen.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Aadhaar</Typography>
                  <Typography variant="body2">{mockApplication.citizen.aadhaar}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={mockApplication.citizen.isVerified ? 'Verified' : 'Unverified'} size="small" color={mockApplication.citizen.isVerified ? 'success' : 'warning'} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Age / Gender</Typography>
                  <Typography variant="body2">{mockApplication.citizen.age} years / {mockApplication.citizen.gender}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Address</Typography>
                  <Typography variant="body2">{mockApplication.citizen.address}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Submitted Documents</Typography>
              <Grid container spacing={1.5}>
                {mockApplication.documents.map((doc) => (
                  <Grid item xs={12} sm={6} key={doc.id}>
                    <Box
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: doc.verified ? 'success.main' : 'warning.main',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <DescriptionIcon color={doc.verified ? 'success' : 'warning'} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.verified ? `Verified by ${doc.verifiedBy} on ${doc.verifiedAt}` : 'Pending verification'}
                        </Typography>
                      </Box>
                      {doc.verified ? <VerifiedIcon color="success" fontSize="small" /> : <ErrorOutlineIcon color="warning" fontSize="small" />}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Application Timeline</Typography>
              <List dense>
                {mockApplication.timeline.map((entry, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          border: '2px solid',
                          borderColor: 'primary.light',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{entry.action}</Typography>
                      }
                      secondary={`${entry.date} • ${entry.by}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <AIRecommendationCard
            recommendation="This applicant meets all eligibility criteria for Kisan Samman Yojana. All required documents are verified. Recommend approval."
            confidence={0.94}
            evidence={[
              'Aadhaar verified against UIDAI database',
              'Land records match government registry',
              'Income within eligibility threshold',
              'No previous applications for same scheme',
            ]}
            type="approval"
            onAccept={() => handleAction('approve')}
            onOverride={() => handleAction('reject')}
          />

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Scheme Details</Typography>
              <Typography variant="subtitle2">{mockApplication.scheme.name}</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">Category: {mockApplication.scheme.category}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Department: {mockApplication.scheme.department}</Typography>
                <Typography variant="caption" display="block" color="text.secondary">Benefit: {mockApplication.scheme.budget}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Officer Notes</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Add your review notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleAction('approve')}
              disabled={actionLoading || status !== 'pending'}
            >
              {actionLoading ? 'Processing...' : 'Approve Application'}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => handleAction('reject')}
              disabled={actionLoading || status !== 'pending'}
            >
              Reject Application
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => handleAction('info')}
              disabled={actionLoading || status !== 'pending'}
            >
              Request More Information
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
