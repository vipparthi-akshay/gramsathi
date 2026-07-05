import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  Badge,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useThemeMode } from '@/theme/ThemeRegistry';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 2 } }}>
        <IconButton edge="start" onClick={onToggleSidebar} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>

        <TextField
          size="small"
          placeholder="Search schemes, citizens, applications..."
          sx={{
            maxWidth: 400,
            flex: { xs: 1, sm: 'none' },
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'action.hover',
              borderRadius: 3,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton onClick={toggleTheme} size="small" sx={{ mx: 0.5 }}>
            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Language">
          <IconButton onClick={(e) => setLangAnchor(e.currentTarget)} size="small" sx={{ mx: 0.5 }}>
            <LanguageIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} onClick={() => setLangAnchor(null)}>
              {lang.label}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title="Notifications">
          <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} size="small" sx={{ mx: 0.5 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          sx={{ '& .MuiPaper-root': { minWidth: 280 } }}
        >
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Box>
              <Typography variant="body2" fontWeight={600}>New Application</Typography>
              <Typography variant="caption" color="text.secondary">Ramesh applied for Kisan Samman Yojana</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Box>
              <Typography variant="body2" fontWeight={600}>Grievance Escalated</Typography>
              <Typography variant="caption" color="text.secondary">Water supply issue escalated to department</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => setNotifAnchor(null)}>
            <Box>
              <Typography variant="body2" fontWeight={600}>Scheme Expiring</Typography>
              <Typography variant="caption" color="text.secondary">PM Awas Yojana closing in 7 days</Typography>
            </Box>
          </MenuItem>
        </Menu>

        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
            {user?.name?.split(' ').map((n) => n[0]).join('')}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
