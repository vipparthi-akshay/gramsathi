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
  Avatar,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import StatusBadge from '@/components/Data/StatusBadge';

const mockCitizen = {
  id: 'CIT-1001',
  name: 'Ramesh Singh',
  phone: '+91-9876543210',
  aadhaar: '1234-5678-9012',
  email: 'ramesh.singh@email.com',
  age: 42,
  gender: 'Male',
  state: 'Uttar Pradesh',
  district: 'Lucknow',
  block: 'Sadar',
  village: 'Purwa',
  address: 'Village Purwa, Block Sadar, District Lucknow, Uttar Pradesh - 226001',
  isVerified: true,
  preferredLanguage: 'Hindi',
  familyMembers: [
    { id: '1', name: 'Sita Devi', relation: 'Wife', age: 38, aadhaar: '2345-6789-0123' },
    { id: '2', name: 'Arun Singh', relation: 'Son', age: 16, aadhaar: '3456-7890-1234' },
    { id: '3', name: 'Priya Singh', relation: 'Daughter', age: 12 },
  ],
  applications: [
    { id: 'APP-001', schemeName: 'Kisan Samman Yojana', status: 'approved', submittedAt: '2024-01-15' },
    { id: 'APP-002', schemeName: 'PM Awas Yojana', status: 'pending', submittedAt: '2024-01-20' },
  ],
  grievances: [
    { id: 'GRV-001', category: 'Water Supply', status: 'open', createdAt: '2024-01-20' },
  ],
  documents: [
    { name: 'Aadhaar Card', verified: true },
    { name: 'Land Records', verified: true },
    { name: 'Income Certificate', verified: false },
  ],
};

export default function CitizenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/citizens')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Citizen Profile</Typography>
            <StatusBadge status={mockCitizen.isVerified ? 'verified' : 'unverified'} size="medium" />
          </Box>
          <Typography variant="body2" color="text.secondary">{id}</Typography>
        </Box>
        {!mockCitizen.isVerified && (
          <Button variant="contained" color="success" startIcon={<VerifiedIcon />}>Verify Citizen</Button>
        )}
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, bgcolor: 'primary.main', fontSize: 28 }}>
                {mockCitizen.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{mockCitizen.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {mockCitizen.age} years | {mockCitizen.gender}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                <Chip label={mockCitizen.preferredLanguage} size="small" />
                <Chip label={mockCitizen.district} size="small" variant="outlined" />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{mockCitizen.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{mockCitizen.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                  <Typography variant="body2">{mockCitizen.address}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Documents</Typography>
              <List dense disablePadding>
                {mockCitizen.documents.map((doc, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {doc.verified ? <VerifiedIcon fontSize="small" color="success" /> : <GppMaybeIcon fontSize="small" color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary={doc.name} secondary={doc.verified ? 'Verified' : 'Pending'} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Family Members</Typography>
              <Grid container spacing={1.5}>
                {mockCitizen.familyMembers.map((member) => (
                  <Grid item xs={12} sm={6} key={member.id}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.relation} • {member.age} years
                      </Typography>
                      {member.aadhaar && <Typography variant="caption" display="block" color="text.secondary">Aadhaar: {member.aadhaar}</Typography>}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`Applications (${mockCitizen.applications.length})`} />
                <Tab label={`Grievances (${mockCitizen.grievances.length})`} />
              </Tabs>

              {tab === 0 && (
                <List dense disablePadding>
                  {mockCitizen.applications.map((app) => (
                    <ListItem key={app.id} sx={{ px: 0, cursor: 'pointer' }} onClick={() => navigate(`/applications/${app.id}`)}>
                      <ListItemText
                        primary={app.schemeName}
                        secondary={`Submitted: ${app.submittedAt}`}
                      />
                      <StatusBadge status={app.status} />
                    </ListItem>
                  ))}
                </List>
              )}

              {tab === 1 && (
                <List dense disablePadding>
                  {mockCitizen.grievances.map((grv) => (
                    <ListItem key={grv.id} sx={{ px: 0, cursor: 'pointer' }} onClick={() => navigate(`/grievances/${grv.id}`)}>
                      <ListItemText
                        primary={grv.category}
                        secondary={`Filed: ${grv.createdAt}`}
                      />
                      <StatusBadge status={grv.status} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
