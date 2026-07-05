'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ShareIcon from '@mui/icons-material/Share';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GramButton from '@/components/ui/GramButton';
import GramEligibilityMeter from '@/components/forms/GramEligibilityMeter';
import GramBottomNav from '@/components/ui/GramBottomNav';

export default function SchemeDetailPage() {
  const router = useRouter();
  const [readAloud, setReadAloud] = useState(false);

  const criteria = [
    { label: 'Income below ₹2L/year', met: true, weight: 30 },
    { label: 'Rural resident', met: true, weight: 25 },
    { label: 'Land ownership', met: false, weight: 20 },
    { label: 'Age 18-60', met: true, weight: 15 },
    { label: 'No other housing scheme', met: true, weight: 10 },
  ];

  const docs = [
    'Aadhaar Card',
    'Income Certificate',
    'Domicile Certificate',
    'Bank Account Details',
    'Passport Size Photo',
  ];

  return (
    <Box sx={{ minHeight: '100vh', pb: 9, backgroundColor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Scheme Details
          </Typography>
          <IconButton onClick={() => setReadAloud(!readAloud)} aria-label="Read aloud">
            <VolumeUpIcon />
          </IconButton>
          <IconButton aria-label="Share scheme">
            <ShareIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip label="88% Match" size="small" color="success" />
            <Chip label="Under Review" size="small" variant="outlined" />
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            PM Awas Yojana (Gramin)
          </Typography>
          <Typography variant="h6" color="primary.main" sx={{ mb: 1 }}>
            पीएम आवास योजना (ग्रामीण)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ministry of Rural Development • Housing Scheme
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Eligibility Check
          </Typography>
          <GramEligibilityMeter score={80} criteria={criteria} size={140} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Benefits
          </Typography>
          <List dense>
            {[
              'Financial assistance up to ₹2.5 lakh',
              'Housing for rural families without pucca house',
              'Top-up loan facility for additional rooms',
              'Convergence with Swachh Bharat Mission',
            ].map((b, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={b} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Required Documents
          </Typography>
          <List dense>
            {docs.map((doc, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={doc} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            How to Apply
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Visit the nearest Common Service Center (CSC) or apply online
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Fill the application form with personal and family details
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Upload required documents
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            4. Submit and note the application reference number
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="error.main" fontWeight={500}>
            * Deadline: June 30, 2026
          </Typography>
        </Box>

        <GramButton variant="primary" fullWidth size="large" onClick={() => router.push('/applications')}>
          Apply Now
        </GramButton>
      </Container>
      <GramBottomNav />
    </Box>
  );
}
