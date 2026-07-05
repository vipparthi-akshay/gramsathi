'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TranslateIcon from '@mui/icons-material/Translate';
import MicIcon from '@mui/icons-material/Mic';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloudIcon from '@mui/icons-material/Cloud';
import ApiIcon from '@mui/icons-material/Api';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GroupsIcon from '@mui/icons-material/Groups';
import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const features = [
  { icon: <TranslateIcon />, title: 'Multilingual AI', desc: 'Supports 22+ Indian languages via Bhashini integration for inclusive access' },
  { icon: <MicIcon />, title: 'Voice-First Interface', desc: 'Voice input and text-to-speech in multiple Indian languages' },
  { icon: <AgricultureIcon />, title: 'Scheme Discovery', desc: 'AI-powered matching of citizens to 1000+ government schemes' },
  { icon: <HowToRegIcon />, title: 'Automated Applications', desc: 'End-to-end application processing with document auto-fill' },
  { icon: <DescriptionIcon />, title: 'Document OCR', desc: 'Multi-lingual document OCR with Aadhaar, ration card processing' },
  { icon: <SecurityIcon />, title: 'Secure Auth', desc: 'Mobile OTP and Aadhaar-based authentication with session management' },
];

const techStack = [
  { category: 'Frontend', items: ['Next.js 14', 'React 18', 'TypeScript', 'MUI 5', 'Framer Motion', 'Recharts'] },
  { category: 'Backend', items: ['FastAPI', 'Python 3.11', 'PostgreSQL', 'Redis', 'Celery', 'WebSocket'] },
  { category: 'AI/ML', items: ['Gemini API', 'LangChain', 'TensorFlow', 'Scikit-learn', 'Bhashini', 'DocAI'] },
  { category: 'DevOps', items: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Helm', 'GCP'] },
];

const services = [
  { name: 'AI Service', desc: 'Chat, translation, OCR, intent classification', color: '#7C3AED' },
  { name: 'Auth Service', desc: 'Mobile OTP, Aadhaar, JWT sessions', color: '#0284C7' },
  { name: 'Scheme Service', desc: 'CRUD, eligibility engine, matching', color: '#059669' },
  { name: 'Document Service', desc: 'Upload, OCR, verification, auto-fill', color: '#D97706' },
  { name: 'Grievance Service', desc: 'Submit, track, escalate, resolve', color: '#DC2626' },
  { name: 'Analytics Service', desc: 'BigQuery dashboards, exports, reports', color: '#7C3AED' },
  { name: 'Notification Service', desc: 'In-app, SMS, WhatsApp, email', color: '#0891B2' },
  { name: 'Citizen Web', desc: 'Responsive PWA for rural citizens', color: '#059669' },
];

export default function PreviewPage() {
  const router = useRouter();
  const [showArch, setShowArch] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
          color: '#fff',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(2,132,199,0.15)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(124,58,237,0.1)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              icon={<SmartToyIcon />}
              label="AI-Powered Government Assistant"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, borderRadius: 2 }}
            />
          </Box>
          <Typography
            variant="h2"
            fontWeight={800}
            textAlign="center"
            sx={{
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #fff 30%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            GramSathi AI
          </Typography>
          <Typography
            variant="h6"
            textAlign="center"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.15rem' },
              fontWeight: 400,
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Empowering rural India with multilingual AI-powered access to government schemes,
            documents, and services — bridging the digital divide with voice-first natural interaction.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => router.push('/test')}
              sx={{
                bgcolor: '#0284C7',
                borderRadius: 28,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                '&:hover': { bgcolor: '#0369A1' },
              }}
            >
              Live Demo
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<GitHubIcon />}
              href="https://github.com/vipparthi-akshay/gramsathi"
              target="_blank"
              sx={{
                borderRadius: 28,
                px: 4,
                py: 1.5,
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                fontWeight: 600,
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
              }}
            >
              View on GitHub
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -6 }, position: 'relative', zIndex: 2, mb: 6 }}>
        <Grid container spacing={2}>
          {[
            { label: 'Microservices', value: '8', color: '#7C3AED' },
            { label: 'Languages', value: '22+', color: '#0284C7' },
            { label: 'Schemes', value: '1,000+', color: '#059669' },
            { label: 'ML Models', value: '4', color: '#D97706' },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ borderRadius: 3, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ py: 3 }}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: stat.color, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
          Key Features
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Built for rural citizens with accessibility, multilingual support, and AI-powered automation
        </Typography>
        <Grid container spacing={2.5}>
          {features.map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ color: 'primary.main', fontSize: 28 }}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                      {f.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: '#0F172A', color: '#fff', py: 6, mb: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 1 }}>
            System Architecture
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, maxWidth: 600, mx: 'auto' }}>
            Eight microservices working together with AI/ML pipelines
          </Typography>
          <Grid container spacing={2}>
            {services.map((s) => (
              <Grid item xs={12} sm={6} md={3} key={s.name}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {s.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                    {s.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 4 }}>
          Tech Stack
        </Typography>
        <Grid container spacing={3}>
          {techStack.map((group) => (
            <Grid item xs={12} sm={6} md={3} key={group.category}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    {group.category}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {group.items.map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                        <Typography variant="body2" color="text.secondary">{item}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Divider sx={{ mb: 4 }} />

      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<BugReportIcon />}
            onClick={() => router.push('/test')}
            sx={{ borderRadius: 28, px: 4, py: 1.5, mb: 2 }}
          >
            Open Testing Dashboard
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label="CI/CD Pipeline"
              variant="outlined"
              size="small"
              color="success"
            />
            <Chip
              icon={<SecurityIcon />}
              label="Security Scan"
              variant="outlined"
              size="small"
              color="info"
            />
            <Chip
              icon={<CloudIcon />}
              label="GCP Deployed"
              variant="outlined"
              size="small"
              color="primary"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, opacity: 0.6 }}>
            <GroupsIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              GramSathi AI — Empowering Rural India with AI-Powered Government Services
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}