'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import PersonIcon from '@mui/icons-material/Person';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import LockIcon from '@mui/icons-material/Lock';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import GramButton from '@/components/ui/GramButton';
import GramBottomNav from '@/components/ui/GramBottomNav';
import { useAppStore, AccessibilityMode } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeMode } from '@/theme/ThemeRegistry';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    accessibilityMode,
    setAccessibilityMode,
    language,
    setLanguage,
    fontScale,
    setFontScale,
  } = useAppStore();
  const { mode, toggleTheme } = useThemeMode();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' }
  ];

  return (
    <Box sx={{ minHeight: '100vh', pb: 12, backgroundColor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ px: 2, pt: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ pb: 3 }}>
          My Profile
        </Typography>

        <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
            <Avatar
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}
              src={user?.avatar}
            >
              {user?.name?.[0] || 'R'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {user?.name || 'Ramesh Kumar'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {user?.mobile || '+91 98765 43210'}
              </Typography>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} sx={{ borderRadius: 2 }}>
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Accordion defaultExpanded sx={{ borderRadius: '16px !important', mb: 2, '&:before': { display: 'none' }, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main' }}>
                <PersonIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Personal Information</Typography>
                <Typography variant="body2" color="text.secondary">Name, DOB, Address</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" defaultValue={user?.name || 'Ramesh Kumar'} variant="outlined" size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date of Birth" defaultValue="15-08-1980" variant="outlined" size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" defaultValue="Village Palampur, District Kangra, Himachal Pradesh 176061" variant="outlined" size="small" multiline rows={2} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded sx={{ borderRadius: '16px !important', mb: 4, '&:before': { display: 'none' }, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'secondary.50', color: 'secondary.main' }}>
                <GroupsIcon />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Family Members</Typography>
                <Typography variant="body2" color="text.secondary">Add or manage family</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
            <Divider sx={{ mb: 2 }} />
            <List sx={{ p: 0 }}>
              <ListItemButton sx={{ borderRadius: 2, mb: 1, bgcolor: 'background.default' }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'info.main' }}>S</Avatar>
                <ListItemText primary="Sita Devi" secondary="Wife • 42 years" />
                <Button size="small">View</Button>
              </ListItemButton>
              <ListItemButton sx={{ borderRadius: 2, mb: 2, bgcolor: 'background.default' }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'warning.main' }}>A</Avatar>
                <ListItemText primary="Arjun Kumar" secondary="Son • 18 years" />
                <Button size="small">View</Button>
              </ListItemButton>
              <Button fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ borderStyle: 'dashed', borderRadius: 2 }}>
                Add Family Member
              </Button>
            </List>
          </AccordionDetails>
        </Accordion>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, px: 1 }}>
          Preferences & Settings
        </Typography>

        <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Display Language
            </Typography>
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {languages.map((l) => (
                <Grid item xs={6} key={l.code}>
                  <Button
                    fullWidth
                    variant={language === l.code ? 'contained' : 'outlined'}
                    onClick={() => setLanguage(l.code)}
                    sx={{ borderRadius: 2, justifyContent: 'flex-start', py: 1 }}
                  >
                    {l.name}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">Toggle high-contrast dark theme</Typography>
              </Box>
              <Switch checked={mode === 'dark'} onChange={toggleTheme} />
            </Box>
          </CardContent>
        </Card>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, px: 1 }}>
          Accessibility
        </Typography>

        <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Font Size Adjustment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Typography variant="caption" fontWeight={600}>A</Typography>
              <Slider
                value={fontScale}
                min={0.8}
                max={1.5}
                step={0.1}
                onChange={(_, v) => setFontScale(v as number)}
                sx={{ flex: 1 }}
                aria-label="Font size"
              />
              <Typography variant="h5" fontWeight={600}>A</Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List sx={{ p: 0 }}>
              {[
                { key: 'highContrast', label: 'High Contrast Mode', desc: 'Enhanced visibility for visually impaired' },
                { key: 'largeText', label: 'Large Text Mode', desc: 'Force large UI elements across app' },
                { key: 'voiceOnly', label: 'Voice Navigation', desc: 'Enable voice-guided interactions' },
              ].map((item) => (
                <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                  </Box>
                  <Switch
                    checked={accessibilityMode === item.key}
                    onChange={() =>
                      setAccessibilityMode(
                        accessibilityMode === item.key ? 'normal' : (item.key as AccessibilityMode)
                      )
                    }
                  />
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, px: 1 }}>
          Linked Accounts
        </Typography>

        <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 0 }}>
            <List sx={{ p: 0 }}>
              <ListItemButton sx={{ p: 3 }}>
                <ListItemIcon><LinkIcon color={user?.aadhaarLinked ? 'success' : 'action'} /></ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={600}>Aadhaar Number</Typography>}
                  secondary={user?.aadhaarLinked ? 'Verified and linked' : 'Not linked - Required for most schemes'}
                />
                <GramButton variant={user?.aadhaarLinked ? 'tonal' : 'primary'} size="small">
                  {user?.aadhaarLinked ? 'Manage' : 'Link Now'}
                </GramButton>
              </ListItemButton>
              <Divider component="li" />
              <ListItemButton sx={{ p: 3 }}>
                <ListItemIcon><LinkIcon color={user?.bankLinked ? 'success' : 'action'} /></ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={600}>Bank Account</Typography>}
                  secondary={user?.bankLinked ? 'HDFC Bank ending in 1234' : 'Not linked - Required for DBT'}
                />
                <GramButton variant={user?.bankLinked ? 'tonal' : 'primary'} size="small">
                  {user?.bankLinked ? 'Manage' : 'Link Now'}
                </GramButton>
              </ListItemButton>
            </List>
          </CardContent>
        </Card>

        <GramButton
          variant="outlined"
          fullWidth
          icon={<LogoutIcon />}
          onClick={handleLogout}
          color="error"
          sx={{ mb: 4, borderRadius: 3, py: 1.5, fontWeight: 700 }}
        >
          Logout from GramSathi
        </GramButton>
      </Container>
      <GramBottomNav />
    </Box>
  );
}
