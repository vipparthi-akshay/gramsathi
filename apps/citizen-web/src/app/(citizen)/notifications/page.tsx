'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import GramButton from '@/components/ui/GramButton';

const notifications = [
  { id: '1', title: 'Application Update', message: 'Your PM Kisan application is now under review', type: 'application', date: 'Today', read: false, icon: <CampaignIcon color="warning" /> },
  { id: '2', title: 'Scheme Deadline Approaching', message: 'PM Awas Yojana deadline is in 7 days', type: 'deadline', date: 'Today', read: false, icon: <InfoIcon color="error" /> },
  { id: '3', title: 'Document Verified', message: 'Your Aadhaar Card has been verified successfully', type: 'document', date: 'Yesterday', read: true, icon: <CheckCircleIcon color="success" /> },
  { id: '4', title: 'New Scheme Launched', message: 'New solar pump subsidy scheme for farmers', type: 'scheme', date: '2 days ago', read: true, icon: <InfoIcon color="primary" /> },
  { id: '5', title: 'Complaint Update', message: 'Your water supply complaint has been escalated', type: 'grievance', date: '3 days ago', read: true, icon: <CampaignIcon color="warning" /> },
];

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', pb: 9, backgroundColor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Notifications
          </Typography>
          <GramButton variant="text" size="small" icon={<DoneAllIcon />}>
            Mark All Read
          </GramButton>
        </Box>

        {notifications.map((notif) => (
          <Card
            key={notif.id}
            sx={{
              borderRadius: 3,
              mb: 1.5,
              opacity: notif.read ? 0.8 : 1,
              cursor: 'pointer',
            }}
          >
            <CardContent sx={{ display: 'flex', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ mt: 0.5 }}>{notif.icon}</Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" fontWeight={notif.read ? 400 : 600}>
                    {notif.title}
                  </Typography>
                  {!notif.read && (
                    <Chip label="New" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {notif.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {notif.date}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Container>
    </Box>
  );
}
