import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'officer' | 'admin' | 'super_admin';
  avatar?: string;
  department?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@gramsathi.gov.in': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@gramsathi.gov.in',
      name: 'Rajesh Kumar',
      role: 'admin',
      department: 'Administration',
      phone: '+91-9876543210',
    },
  },
  'officer@gramsathi.gov.in': {
    password: 'officer123',
    user: {
      id: '2',
      email: 'officer@gramsathi.gov.in',
      name: 'Priya Sharma',
      role: 'officer',
      department: 'Scheme Processing',
      phone: '+91-9876543211',
    },
  },
  'superadmin@gramsathi.gov.in': {
    password: 'super123',
    user: {
      id: '3',
      email: 'superadmin@gramsathi.gov.in',
      name: 'Amit Verma',
      role: 'super_admin',
      department: 'System Administration',
      phone: '+91-9876543212',
    },
  },
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const found = mockUsers[email];
        if (!found || found.password !== password) {
          reject(new Error('Invalid email or password'));
          return;
        }
        const token = 'mock-jwt-' + Date.now();
        localStorage.setItem('gramSathiToken', token);
        localStorage.setItem('gramSathiUser', JSON.stringify(found.user));
        set({ user: found.user, token, isAuthenticated: true });
        resolve();
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem('gramSathiToken');
    localStorage.removeItem('gramSathiUser');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const permissions: Record<string, string[]> = {
      admin: ['manage_schemes', 'manage_users', 'view_analytics', 'manage_settings'],
      officer: ['view_schemes', 'process_applications', 'view_citizens', 'manage_grievances'],
      citizen: ['view_schemes', 'apply_schemes'],
    };
    return permissions[user.role]?.includes(permission) ?? false;
  },
}));
