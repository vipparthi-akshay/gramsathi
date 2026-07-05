import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GramTable from '@/components/Data/GramTable';
import GramFilterBar from '@/components/Data/GramFilterBar';
import StatusBadge from '@/components/Data/StatusBadge';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { SystemUser } from '@/services/users';

const mockUsers: SystemUser[] = [
  { id: '1', email: 'admin@gramsathi.gov.in', name: 'Rajesh Kumar', role: 'admin', department: 'Administration', phone: '+91-9876543210', isActive: true, lastLogin: '2024-01-25 09:30 AM', permissions: ['manage_schemes', 'manage_users', 'view_analytics'], createdAt: '2024-01-01' },
  { id: '2', email: 'officer@gramsathi.gov.in', name: 'Priya Sharma', role: 'officer', department: 'Scheme Processing', phone: '+91-9876543211', isActive: true, lastLogin: '2024-01-25 10:15 AM', permissions: ['process_applications', 'view_citizens'], createdAt: '2024-01-01' },
  { id: '3', email: 'superadmin@gramsathi.gov.in', name: 'Amit Verma', role: 'super_admin', department: 'System Administration', phone: '+91-9876543212', isActive: true, lastLogin: '2024-01-25 08:00 AM', permissions: ['*'], createdAt: '2024-01-01' },
  { id: '4', email: 'sneha.patel@gramsathi.gov.in', name: 'Sneha Patel', role: 'officer', department: 'Grievance Cell', phone: '+91-9876543213', isActive: true, lastLogin: '2024-01-24 02:30 PM', permissions: ['manage_grievances'], createdAt: '2024-01-05' },
  { id: '5', email: 'vikram.singh@gramsathi.gov.in', name: 'Vikram Singh', role: 'officer', department: 'Field Operations', phone: '+91-9876543214', isActive: false, lastLogin: '2024-01-20 11:00 AM', permissions: ['process_applications', 'view_citizens', 'manage_grievances'], createdAt: '2024-01-03' },
  { id: '6', email: 'anita.desa@gramsathi.gov.in', name: 'Anita Desai', role: 'admin', department: 'Regional Office', phone: '+91-9876543215', isActive: true, lastLogin: '2024-01-23 04:45 PM', permissions: ['manage_schemes', 'view_analytics'], createdAt: '2024-01-10' },
];

const roles = ['officer', 'admin', 'super_admin'];
const departments = ['Administration', 'Scheme Processing', 'Grievance Cell', 'Field Operations', 'Regional Office', 'System Administration'];
const allPermissions = ['manage_schemes', 'manage_users', 'view_analytics', 'process_applications', 'view_citizens', 'manage_grievances', 'manage_settings'];

export default function Users() {
  const { filters, setFilter, clearFilters } = useFilters();
  const debouncedSearch = useDebounce(filters.search);
  const { page, limit, total, setTotal, setPage, setLimit } = usePagination(10);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'officer', department: '', phone: '' });
  const [deleteDialog, setDeleteDialog] = useState<SystemUser | null>(null);

  useEffect(() => {
    let filtered = [...mockUsers];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filters.role) filtered = filtered.filter((u) => u.role === filters.role);
    if (filters.status) filtered = filtered.filter((u) => filters.status === 'active' ? u.isActive : !u.isActive);
    setTotal(filtered.length);
    const start = (page - 1) * limit;
    setUsers(filtered.slice(start, start + limit));
  }, [debouncedSearch, filters.role, filters.status, page, limit, setTotal]);

  const handleOpenCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'officer', department: '', phone: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department, phone: user.phone });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  const handleToggleActive = (user: SystemUser) => {
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.id));
    setDeleteDialog(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage system users and roles</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add User
        </Button>
      </Box>

      <GramFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
        showStatus
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        showCategory={false}
        placeholder="Search by name or email..."
      />

      <Box sx={{ mt: 2 }}>
        <GramTable
          columns={[
            { id: 'name', label: 'Name', render: (row: SystemUser) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                <Typography variant="caption" color="text.secondary">{row.email}</Typography>
              </Box>
            ), sortable: true },
            { id: 'role', label: 'Role', render: (row: SystemUser) => (
              <Chip label={row.role.replace('_', ' ')} size="small" color={row.role === 'super_admin' ? 'warning' : row.role === 'admin' ? 'primary' : 'default'} sx={{ textTransform: 'capitalize' }} />
            ) },
            { id: 'department', label: 'Department', render: (row: SystemUser) => row.department },
            { id: 'phone', label: 'Phone', render: (row: SystemUser) => row.phone },
            { id: 'lastLogin', label: 'Last Login', render: (row: SystemUser) => row.lastLogin || 'Never', sortable: true },
            { id: 'status', label: 'Status', render: (row: SystemUser) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
          ]}
          data={users}
          keyExtractor={(row) => row.id}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          actions={(row: SystemUser) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}>
                <IconButton size="small" onClick={() => handleToggleActive(row)}>
                  <Switch size="small" checked={row.isActive} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog(row)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
          )}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {!editUser && <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
            <TextField select fullWidth label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((r) => <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">{editUser ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
