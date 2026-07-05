'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GramButton from '@/components/ui/GramButton';

const faqs = [
  { q: 'How do I check my scheme eligibility?', a: 'Go to the Schemes section, select a scheme, and tap "Check Eligibility". The AI will analyze your profile and show your match score.' },
  { q: 'How to upload documents?', a: 'Go to Documents section and tap "Upload". You can take a photo or choose from gallery. The AI will automatically extract the information.' },
  { q: 'How to apply for a scheme?', a: 'Find the scheme you want, tap "Apply Now", fill the form, upload required documents, and submit.' },
  { q: 'How to track my application?', a: 'Go to Applications section to see all your applications with their current status and progress.' },
  { q: 'How to file a complaint?', a: 'Go to Grievances, tap "New Complaint", describe your issue, and the AI will draft a formal complaint for you.' },
  { q: 'Is my data safe?', a: 'Yes, all your personal data is encrypted and stored securely. We follow government security standards.' },
  { q: 'Can I use voice input?', a: 'Yes! Tap the microphone icon anywhere to use voice input. Supports multiple Indian languages.' },
  { q: 'How to change language?', a: 'Go to Profile > Language to select from 22 Indian languages including Hindi, Marathi, Tamil, and more.' },
];

export default function HelpPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 9, backgroundColor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Help Center
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
            color: '#fff',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/ai')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
            <SmartToyIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Ask GramBot
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Get instant answers to your questions
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Frequently Asked Questions
        </Typography>

        {faqs.map((faq, idx) => (
          <Accordion
            key={idx}
            expanded={expanded === `panel${idx}`}
            onChange={handleChange(`panel${idx}`)}
            sx={{ borderRadius: 2, mb: 1, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={500}>
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
          Still need help?
        </Typography>
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Contact our support team or visit your nearest Common Service Center (CSC).
            </Typography>
            <GramButton variant="primary" fullWidth icon={<LiveHelpIcon />}>
              Contact Support
            </GramButton>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
