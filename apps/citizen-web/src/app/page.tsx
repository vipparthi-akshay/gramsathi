'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LanguageIcon from '@mui/icons-material/Language';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import DescriptionIcon from '@mui/icons-material/Description';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useThemeMode } from '@/theme/ThemeRegistry';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import {
  mockUser, mockSchemes, mockApplications, mockNews, dashboardStats,
} from '@/services/mockData';
import GramBottomNav from '@/components/ui/GramBottomNav';
import GramLanguageSelector from '@/components/ui/GramLanguageSelector';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const statusColors: Record<string, string> = {
  draft: '#757575',
  submitted: '#1565C0',
  under_review: '#F57F17',
  approved: '#2E7D32',
  rejected: '#C62828',
  cancelled: '#757575',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const categoryColors: Record<string, string> = {
  Agriculture: '#2E7D32',
  Employment: '#1565C0',
  Health: '#F57F17',
  Housing: '#E65100',
  'Finance & Banking': '#5C6BC0',
  Pension: '#AD1457',
  Energy: '#FF6F00',
  Education: '#7B1FA2',
  'Social Welfare': '#00897B',
};

export default function HomePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage } = useAppStore();
  const { user, isAuthenticated } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);
  const [anchorLang, setAnchorLang] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [hour, setHour] = useState(12);

  const activeUser = mockUser;
  const stats = dashboardStats;
  const activeApps = mockApplications.filter((a) => a.status !== 'cancelled');
  const news = mockNews.slice(0, 3);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting = hour < 12 ? t('common.morningGreeting', 'Good Morning') : hour < 17 ? t('common.afternoonGreeting', 'Good Afternoon') : t('common.eveningGreeting', 'Good Evening');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    setLangOpen(false);
    setAnchorLang(null);
    toast.success(`Language changed`);
  };

  const langList = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  ];

  const statCards = [
    { label: t('home.activeApplications', 'Active Apps'), value: stats.activeApplications, icon: HowToRegIcon, color: '#1565C0', bg: 'rgba(21,101,192,0.1)' },
    { label: t('applications.approved', 'Approved'), value: stats.approvedSchemes, icon: CheckCircleIcon, color: '#2E7D32', bg: 'rgba(46,125,50,0.1)' },
    { label: t('documents.pending', 'Pending Docs'), value: stats.pendingDocuments, icon: DescriptionIcon, color: '#F57F17', bg: 'rgba(245,127,23,0.1)' },
    { label: t('schemes.savedSchemes', 'Saved'), value: stats.savedSchemes, icon: BookmarkIcon, color: '#7B1FA2', bg: 'rgba(123,31,162,0.1)' },
  ];

  const pieData = Object.entries(
    mockSchemes.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const chartData = mockApplications
    .filter((a) => a.status !== 'cancelled')
    .map((a) => ({
      name: a.schemeName.split(' ')[0],
      progress: a.progress,
      status: a.status,
      color: statusColors[a.status],
    }));

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          pb: 9,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #020617 0%, #0F172A 100%)'
              : 'linear-gradient(180deg, #F0F9FF 0%, #F8FAFC 40%, #FFFFFF 100%)',
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 2 }}>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img src="/logo.png" alt="GramSathi AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {t('common.appName', 'GramSathi AI')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                  <IconButton
                    size="small"
                    onClick={toggleTheme}
                    sx={{
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 2,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Change Language">
                  <IconButton
                    size="small"
                    onClick={(e) => setAnchorLang(e.currentTarget)}
                    sx={{
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 2,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <LanguageIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorLang}
                  open={Boolean(anchorLang)}
                  onClose={() => setAnchorLang(null)}
                  sx={{ '& .MuiPaper-root': { borderRadius: 3, mt: 1, minWidth: 180 } }}
                >
                  {langList.map((l) => (
                    <MenuItem
                      key={l.code}
                      selected={language === l.code}
                      onClick={() => handleLanguageSelect(l.code)}
                      sx={{ borderRadius: 2, mx: 0.5 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2">
                          {l.native}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
                <Tooltip title="Notifications">
                  <IconButton
                    size="small"
                    onClick={(e) => setNotifAnchor(e.currentTarget)}
                    sx={{
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 2,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Badge badgeContent={stats.notificationsUnread} color="error" max={99}>
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={notifAnchor}
                  open={Boolean(notifAnchor)}
                  onClose={() => setNotifAnchor(null)}
                  sx={{ '& .MuiPaper-root': { borderRadius: 3, mt: 1, minWidth: 300 } }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Notifications</Typography>
                  </Box>
                  <Divider />
                  {mockNews.slice(0, 3).map((n) => (
                    <MenuItem key={n.id} onClick={() => setNotifAnchor(null)} sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                          {n.titleLocal}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {n.date}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={() => { setNotifAnchor(null); router.push('/notifications'); }} sx={{ borderRadius: 2, mx: 0.5, justifyContent: 'center' }}>
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      View All
                    </Typography>
                  </MenuItem>
                </Menu>
                <IconButton
                  size="small"
                  onClick={() => router.push('/profile')}
                  sx={{
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderRadius: 2,
                    width: 36,
                    height: 36,
                  }}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </motion.div>

          {/* Hero Banner */}
          <motion.div variants={stagger} initial="initial" animate="animate">
            <motion.div variants={fadeUp}>
              <Card
                sx={{
                  mb: 3,
                  borderRadius: 4,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.info.dark} 100%)`
                      : `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.info.main} 100%)`,
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-30%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-30%',
                    left: '-20%',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, position: 'relative', zIndex: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar
                          sx={{
                            width: 52,
                            height: 52,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            fontSize: 20,
                            fontWeight: 700,
                            border: '2px solid rgba(255,255,255,0.3)',
                          }}
                        >
                          {activeUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                            {greeting}, {activeUser.name.split(' ')[0]}!
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.85rem' }}>
                            {activeUser.village}, {activeUser.district} |{' '}
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              {activeUser.occupation}
                            </Box>
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          label={`Aadhaar ${activeUser.aadhaarLinked ? 'Linked' : 'Not Linked'}`}
                          size="small"
                          sx={{
                            bgcolor: activeUser.aadhaarLinked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            height: 26,
                            '& .MuiChip-icon': { color: '#fff' },
                          }}
                        />
                        <Chip
                          icon={<CurrencyRupeeIcon sx={{ fontSize: 14 }} />}
                          label={`${t('common.totalBenefits', 'Total Benefits')}: ${stats.totalBenefits}`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            height: 26,
                            '& .MuiChip-icon': { color: '#fff' },
                          }}
                        />
                        <Chip
                          icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                          label={`${stats.activeApplications} Active`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            height: 26,
                            '& .MuiChip-icon': { color: '#fff' },
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={() => router.push('/schemes')}
                        endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          color: '#fff',
                          borderRadius: 28,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                        }}
                      >
                        {t('home.findSchemes', 'Explore Schemes')}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={fadeUp}>
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {statCards.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <Grid item xs={6} sm={3} key={stat.label}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.06 }}
                      >
                        <Card
                          sx={{
                            borderRadius: 3,
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : stat.bg,
                            backdropFilter: 'blur(8px)',
                            border: '1px solid',
                            borderColor: (theme) =>
                              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'transparent',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? '0 4px 20px rgba(0,0,0,0.3)'
                                  : '0 4px 20px rgba(0,0,0,0.08)',
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="h4" fontWeight={700} sx={{ fontSize: '1.6rem', lineHeight: 1 }}>
                                  {stat.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                                  {stat.label}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  bgcolor: stat.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: stat.color,
                                }}
                              >
                                <Icon sx={{ fontSize: 18 }} />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </motion.div>

            {/* Main Content: Charts + Applications */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {/* Active Applications */}
              <Grid item xs={12} md={7}>
                <motion.div variants={fadeUp}>
                  <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                          {t('home.activeApplications', 'Active Applications')}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => router.push('/applications')}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {t('common.viewAll', 'View All')}
                        </Button>
                      </Box>
                      {chartData.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          {t('applications.noApplications', 'No applications yet')}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {mockApplications
                            .filter((a) => a.status !== 'cancelled' && a.status !== 'draft')
                            .slice(0, 4)
                            .map((app, idx) => (
                              <motion.div
                                key={app.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: (theme) =>
                                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    '&:hover': {
                                      bgcolor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    },
                                  }}
                                  onClick={() => router.push(`/applications/${app.id}`)}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Box
                                        sx={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: '50%',
                                          bgcolor: statusColors[app.status],
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                                        {language === 'hi' ? app.schemeNameLocal : app.schemeName}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={statusLabels[app.status]}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        bgcolor: `${statusColors[app.status]}18`,
                                        color: statusColors[app.status],
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={app.progress}
                                      sx={{
                                        flex: 1,
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: (theme) =>
                                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: statusColors[app.status],
                                          borderRadius: 3,
                                        },
                                      }}
                                    />
                                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', minWidth: 30, textAlign: 'right' }}>
                                      {app.progress}%
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', mt: 0.25, display: 'block' }}>
                                    Last updated: {new Date(app.updatedAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </motion.div>
                            ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              {/* Charts */}
              <Grid item xs={12} md={5}>
                <motion.div variants={fadeUp}>
                  <Card sx={{ borderRadius: 3, mb: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem', mb: 1.5 }}>
                        {t('schemes.categories', 'Schemes by Category')}
                      </Typography>
                      <Box sx={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={72}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={categoryColors[entry.name] || '#90A4AE'}
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <ReTooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                fontSize: '0.8rem',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1, justifyContent: 'center' }}>
                        {pieData.slice(0, 5).map((d) => (
                          <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: categoryColors[d.name] || '#90A4AE' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                              {t(`schemes.${d.name.toLowerCase().replace(/[^a-z]/g, '')}`, d.name)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Quick Tip / News */}
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                          {t('home.recentActivity', 'Latest Updates')}
                        </Typography>
                        <Button size="small" sx={{ fontSize: '0.75rem' }} onClick={() => router.push('/notifications')}>
                          {t('common.viewAll', 'View All')}
                        </Button>
                      </Box>
                      {news.map((item, idx) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1.25,
                            mb: idx < news.length - 1 ? 1 : 0,
                            borderRadius: 2,
                            bgcolor: item.isUrgent
                              ? (theme) =>
                                  theme.palette.mode === 'dark' ? 'rgba(198,40,40,0.08)' : 'rgba(198,40,40,0.04)'
                              : 'transparent',
                            border: item.isUrgent
                              ? '1px solid'
                              : '1px solid transparent',
                            borderColor: item.isUrgent ? 'rgba(198,40,40,0.15)' : 'transparent',
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight={item.isUrgent ? 600 : 500}
                                sx={{ fontSize: '0.78rem', lineHeight: 1.3 }}
                              >
                                {language === 'hi' ? item.titleLocal : item.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={item.category}
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.6rem', borderRadius: 1 }}
                                />
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                  {item.date}
                                </Typography>
                              </Box>
                            </Box>
                            {item.isUrgent && (
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  bgcolor: 'error.main',
                                  color: '#fff',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  height: 'fit-content',
                                }}
                              >
                                URGENT
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>

            {/* Recommended Schemes */}
            <motion.div variants={fadeUp}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                    {t('home.recommendedSchemes', 'Recommended Schemes')}
                  </Typography>
                  <Button size="small" onClick={() => router.push('/schemes')} sx={{ fontSize: '0.75rem' }}>
                    {t('common.viewAll', 'View All')} ({mockSchemes.length})
                  </Button>
                </Box>
                <Grid container spacing={1.5}>
                  {mockSchemes.slice(0, 4).map((scheme, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={scheme.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        <Card
                          sx={{
                            borderRadius: 3,
                            height: '100%',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? '0 8px 24px rgba(0,0,0,0.3)'
                                  : '0 8px 24px rgba(0,0,0,0.1)',
                            },
                            position: 'relative',
                            overflow: 'visible',
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: 12,
                              zIndex: 2,
                            }}
                          >
                            <Chip
                              label={`${scheme.matchScore}% ${t('schemes.sortMatch', 'Match').split(' ').pop() || 'Match'}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22,
                                bgcolor: scheme.matchScore >= 80 ? '#2E7D32' : scheme.matchScore >= 50 ? '#F57F17' : '#C62828',
                                color: '#fff',
                              }}
                            />
                          </Box>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  bgcolor: `${scheme.color}18`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 18,
                                  flexShrink: 0,
                                }}
                              >
                                {scheme.icon}
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                  fontSize: '0.82rem',
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {language === 'hi' ? scheme.nameLocal : scheme.name}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.7rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                                lineHeight: 1.3,
                              }}
                            >
                              {language === 'hi' ? scheme.descriptionLocal : scheme.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              <Chip
                                label={t(`schemes.${scheme.category.toLowerCase().replace(/[^a-z]/g, '')}`, scheme.category)}
                                size="small"
                                sx={{ height: 20, fontSize: '0.6rem', borderRadius: 1 }}
                              />
                              {scheme.deadline && (
                                <Chip
                                  label={scheme.deadline}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.6rem', borderRadius: 1 }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                  toast.success(`Application for ${scheme.nameLocal} started!`);
                                }}
                                sx={{
                                  flex: 1,
                                  height: 32,
                                  fontSize: '0.7rem',
                                  borderRadius: 2,
                                  bgcolor: scheme.color,
                                  '&:hover': { bgcolor: scheme.color, opacity: 0.9 },
                                }}
                              >
                                {t('schemes.applyNow', 'Apply')}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => router.push(`/schemes/${scheme.id}`)}
                                sx={{
                                  height: 32,
                                  fontSize: '0.7rem',
                                  borderRadius: 2,
                                  minWidth: 'auto',
                                  px: 1.5,
                                }}
                              >
                                {t('applications.viewDetails', 'Details')}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.div>

            {/* Government Badge */}
            <motion.div variants={fadeUp}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 2,
                  opacity: 0.7,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                  <GroupsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    GramSathi AI - A Government of India Initiative
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                  Empowering Rural India with AI-Powered Government Services
                </Typography>
              </Box>
            </motion.div>
          </motion.div>
        </Container>
      </Box>
      <GramBottomNav />
      <GramLanguageSelector
        open={langOpen}
        onClose={() => setLangOpen(false)}
      />
    </>
  );
}
