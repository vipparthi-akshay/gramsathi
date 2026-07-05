import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '@/store/authStore';
import { useThemeMode } from '@/theme/ThemeRegistry';

export default function Settings() {
  const { user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    grievanceUpdates: true,
    applicationUpdates: true,
    weeklyReport: false,
  });

  const [apiConfig, setApiConfig] = useState({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: '30000',
    retryCount: '3',
  });

  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your preferences and system configuration</Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Profile</Typography>
                <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 20 }}>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{profile.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {user?.role?.replace('_', ' ')}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Email" value={profile.email} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Department" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                </Grid>
              </Grid>

              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProfile} sx={{ mt: 2 }}>
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Notification Preferences</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel control={<Switch checked={notifications.emailAlerts} onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })} />} label="Email Alerts" />
                <FormControlLabel control={<Switch checked={notifications.pushNotifications} onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })} />} label="Push Notifications" />
                <FormControlLabel control={<Switch checked={notifications.grievanceUpdates} onChange={(e) => setNotifications({ ...notifications, grievanceUpdates: e.target.checked })} />} label="Grievance Updates" />
                <FormControlLabel control={<Switch checked={notifications.applicationUpdates} onChange={(e) => setNotifications({ ...notifications, applicationUpdates: e.target.checked })} />} label="Application Updates" />
                <FormControlLabel control={<Switch checked={notifications.weeklyReport} onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })} />} label="Weekly Report Digest" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Appearance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Theme Mode</Typography>
                    <Typography variant="caption" color="text.secondary">Current: {mode === 'light' ? 'Light' : 'Dark'}</Typography>
                  </Box>
                </Box>
                <Switch checked={mode === 'dark'} onChange={toggleTheme} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>API Configuration</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Base URL" value={apiConfig.baseUrl} onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Timeout (ms)" type="number" value={apiConfig.timeout} onChange={(e) => setApiConfig({ ...apiConfig, timeout: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Retry Count" type="number" value={apiConfig.retryCount} onChange={(e) => setApiConfig({ ...apiConfig, retryCount: e.target.value })} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {user?.role === 'super_admin' && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>System Settings (Admin)</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Default Language</InputLabel>
                    <Select value="en" label="Default Language">
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="mr">Marathi</MenuItem>
                      <MenuItem value="ta">Tamil</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Data Retention Period</InputLabel>
                    <Select value="90" label="Data Retention Period">
                      <MenuItem value="30">30 days</MenuItem>
                      <MenuItem value="90">90 days</MenuItem>
                      <MenuItem value="180">180 days</MenuItem>
                      <MenuItem value="365">1 year</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel control={<Switch defaultChecked />} label="Enable AI Auto-Approvals" />
                  <FormControlLabel control={<Switch defaultChecked />} label="Enable Sentiment Analysis" />
                  <FormControlLabel control={<Switch />} label="Maintenance Mode" />
                  <Button variant="contained" color="warning" startIcon={<SaveIcon />}>Save System Settings</Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
