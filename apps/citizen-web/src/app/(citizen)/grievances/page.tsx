'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import FeedbackIcon from '@mui/icons-material/Feedback';
import GramButton from '@/components/ui/GramButton';
import GramBottomNav from '@/components/ui/GramBottomNav';

const complaints = [
  { id: '1', subject: 'Water supply issue in village', department: 'Water Supply Department', status: 'under_review', date: '2026-03-20', ref: 'GRV-2026-0042' },
  { id: '2', subject: 'Land record correction pending', department: 'Revenue Department', status: 'resolved', date: '2026-02-15', ref: 'GRV-2026-0031' },
];

export default function GrievancesPage() {
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', pb: 9, backgroundColor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Grievances
          </Typography>
          <GramButton
            variant="primary"
            size="small"
            icon={<AddIcon />}
            onClick={() => router.push('/grievances/new')}
          >
            New
          </GramButton>
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/grievances/new')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <FeedbackIcon sx={{ fontSize: 40, opacity: 0.9 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                File a New Complaint
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                AI will help draft your complaint
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          My Complaints
        </Typography>

        {complaints.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No complaints filed yet
            </Typography>
          </Box>
        ) : (
          complaints.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 3, mb: 2, cursor: 'pointer' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {c.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {c.department}
                    </Typography>
                  </Box>
                  <Chip
                    label={c.status === 'under_review' ? 'Under Review' : 'Resolved'}
                    size="small"
                    color={c.status === 'resolved' ? 'success' : 'warning'}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Ref: {c.ref} • {c.date}
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
