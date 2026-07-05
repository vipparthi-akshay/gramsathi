import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Divider,
  Collapse,
  Avatar,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '@/store/authStore';
import type { UserRole } from '@/routes';

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: { label: string; path: string }[];
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/overview', roles: ['officer', 'admin', 'super_admin'] },
  { label: 'Schemes', icon: <AssignmentIcon />, path: '/schemes', roles: ['officer', 'admin', 'super_admin'] },
  { label: 'Applications', icon: <DescriptionIcon />, path: '/applications', roles: ['officer', 'admin', 'super_admin'] },
  { label: 'Grievances', icon: <FeedbackIcon />, path: '/grievances', roles: ['officer', 'admin', 'super_admin'] },
  { label: 'Citizens', icon: <PeopleIcon />, path: '/citizens', roles: ['officer', 'admin', 'super_admin'] },
  { label: 'Analytics', icon: <BarChartIcon />, path: '/analytics', roles: ['admin', 'super_admin'] },
  { label: 'Users', icon: <AdminPanelSettingsIcon />, path: '/users', roles: ['super_admin'] },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['officer', 'admin', 'super_admin'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, variant, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role as UserRole);
  });

  const drawerWidth = collapsed ? 64 : 260;

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2,
          py: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src="/favicon.svg" sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              G
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>GramSathi</Typography>
              <Typography variant="caption" color="text.secondary">AI Platform</Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Avatar src="/favicon.svg" sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            G
          </Avatar>
        )}
        {variant === 'permanent' && (
          <IconButton onClick={onToggleCollapse} size="small">
            <ChevronLeftIcon sx={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {filteredItems.map((item) => (
          <ListItemButton
            key={item.label}
            selected={item.path ? isActive(item.path) : false}
            onClick={() => {
              if (item.path) {
                navigate(item.path);
                if (variant === 'temporary') onClose();
              }
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { backgroundColor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {!collapsed && user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 14 }}>
            {user.name.split(' ').map((n) => n[0]).join('')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user.role.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
