'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PersonIcon from '@mui/icons-material/Person';

const navItems = [
  { label: 'navigation.home', icon: HomeIcon, href: '/' },
  { label: 'navigation.aiAssistant', icon: ChatIcon, href: '/ai' },
  { label: 'navigation.schemes', icon: DescriptionIcon, href: '/schemes' },
  { label: 'navigation.grievances', icon: FeedbackIcon, href: '/grievances' },
  { label: 'navigation.profile', icon: PersonIcon, href: '/profile' },
];

export default function GramBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const currentValue = navItems.findIndex((item) => {
    const path = pathname.replace(/^\/(hi|mr|ta|te|bn|gu|kn|ml|or|pa|as|mai|sat|ks|ne|sd|ur|brx|doi|mni|kok|en)/, '');
    return path === item.href || (item.href !== '/' && path.startsWith(item.href));
  });

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
      elevation={3}
      role="navigation"
      aria-label="Main navigation"
    >
      <BottomNavigation
        value={currentValue >= 0 ? currentValue : 0}
        onChange={(_, newValue) => {
          router.push(navItems[newValue].href);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={t(item.label)}
            icon={<item.icon />}
            aria-label={t(item.label)}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
