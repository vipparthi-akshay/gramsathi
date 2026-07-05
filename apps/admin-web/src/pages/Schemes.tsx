import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteIcon from '@mui/icons-material/Delete';
import GramTable from '@/components/Data/GramTable';
import GramFilterBar from '@/components/Data/GramFilterBar';
import StatusBadge from '@/components/Data/StatusBadge';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Scheme } from '@/services/schemes';

const mockSchemes: Scheme[] = [
  {
    id: '1', name: 'Kisan Samman Yojana', nameHi: 'किसान सम्मान योजना',
    description: 'Financial support for farmers across India',
    category: 'Agriculture', department: 'Ministry of Agriculture',
    eligibilityCriteria: { age: '18-60', income: '<5L' },
    benefits: ['₹6000/year', 'Direct Bank Transfer'],
    documentRequirements: ['Aadhaar', 'Land Records', 'Bank Account'],
    startDate: '2024-01-01', endDate: '2025-12-31',
    isActive: true, totalApplicants: 12500, budget: 500000000,
    createdAt: '2024-01-01', updatedAt: '2024-01-15',
  },
  {
    id: '2', name: 'PM Awas Yojana', nameHi: 'प्रधानमंत्री आवास योजना',
    description: 'Housing for all by 2025',
    category: 'Housing', department: 'Ministry of Housing',
    eligibilityCriteria: { income: '<3L', landless: true },
    benefits: ['₹1.2L subsidy', 'Technical support'],
    documentRequirements: ['Aadhaar', 'Income Certificate', 'Land Document'],
    startDate: '2024-02-01', endDate: '2025-12-31',
    isActive: true, totalApplicants: 8900, budget: 750000000,
    createdAt: '2024-02-01', updatedAt: '2024-01-20',
  },
  {
    id: '3', name: 'Shiksha Protsahan', nameHi: 'शिक्षा प्रोत्साहन',
    description: 'Education support for underprivileged children',
    category: 'Education', department: 'Ministry of Education',
    eligibilityCriteria: { age: '6-18', income: '<2.5L' },
    benefits: ['Free tuition', 'School supplies', 'Scholarship'],
    documentRequirements: ['Aadhaar', 'Income Certificate', 'School ID'],
    startDate: '2024-03-01', endDate: '2025-03-01',
    isActive: true, totalApplicants: 5600, budget: 200000000,
    createdAt: '2024-03-01', updatedAt: '2024-01-18',
  },
  {
    id: '4', name: 'Digital Gram Yojana', nameHi: 'डिजिटल ग्राम योजना',
    description: 'Digital infrastructure in rural areas',
    category: 'Technology', department: 'Ministry of IT',
    eligibilityCriteria: { village_population: '<5000' },
    benefits: ['Free WiFi', 'Computer center', 'Digital literacy'],
    documentRequirements: ['Gram Panchayat Resolution'],
    startDate: '2024-04-01', endDate: '2026-03-31',
    isActive: false, totalApplicants: 1200, budget: 350000000,
    createdAt: '2024-04-01', updatedAt: '2024-01-22',
  },
  {
    id: '5', name: 'Swasthya Raksha', nameHi: 'स्वास्थ्य रक्षा',
    description: 'Health insurance for rural families',
    category: 'Health', department: 'Ministry of Health',
    eligibilityCriteria: { income: '<3L', family_size: '<=5' },
    benefits: ['₹5L coverage', 'Free checkups', 'Medicine subsidy'],
    documentRequirements: ['Aadhaar', 'BPL Certificate', 'Family ID'],
    startDate: '2024-05-01', endDate: '2025-12-31',
    isActive: true, totalApplicants: 7800, budget: 600000000,
    createdAt: '2024-05-01', updatedAt: '2024-01-25',
  },
  {
    id: '6', name: 'Nari Shakti', nameHi: 'नारी शक्ति',
    description: 'Women empowerment scheme',
    category: 'Social Welfare', department: 'Ministry of Women & Child',
    eligibilityCriteria: { gender: 'female', income: '<2.5L' },
    benefits: ['Skill training', '₹50k grant', 'Business support'],
    documentRequirements: ['Aadhaar', 'Income Certificate'],
    startDate: '2024-06-01', endDate: '2025-06-01',
    isActive: true, totalApplicants: 3400, budget: 150000000,
    createdAt: '2024-06-01', updatedAt: '2024-01-28',
  },
];

const categories = ['Agriculture', 'Housing', 'Education', 'Health', 'Social Welfare', 'Technology', 'Employment', 'Finance'];

export default function Schemes() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useFilters();
  const debouncedSearch = useDebounce(filters.search);
  const { page, limit, total, setTotal, setPage, setLimit } = usePagination(10);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<Scheme | null>(null);

  useEffect(() => {
    let filtered = [...mockSchemes];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.nameHi?.includes(q) || s.description.toLowerCase().includes(q));
    }
    if (filters.category) {
      filtered = filtered.filter((s) => s.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter((s) => filters.status === 'active' ? s.isActive : !s.isActive);
    }
    setTotal(filtered.length);
    const start = (page - 1) * limit;
    setSchemes(filtered.slice(start, start + limit));
  }, [debouncedSearch, filters.category, filters.status, page, limit, setTotal]);

  const handleToggleActive = (scheme: Scheme) => {
    setSchemes((prev) => prev.map((s) => s.id === scheme.id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleDelete = () => {
    if (!deleteDialog) return;
    setSchemes((prev) => prev.filter((s) => s.id !== deleteDialog.id));
    setDeleteDialog(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Scheme Management</Typography>
          <Typography variant="body2" color="text.secondary">Create and manage government schemes</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/schemes/new')}>
          Create Scheme
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
        showCategory
        categoryOptions={categories.map((c) => ({ value: c, label: c }))}
        placeholder="Search schemes..."
      />

      <Box sx={{ mt: 2 }}>
        <GramTable
          columns={[
            { id: 'name', label: 'Name', render: (row: Scheme) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                {row.nameHi && <Typography variant="caption" color="text.secondary">{row.nameHi}</Typography>}
              </Box>
            ), sortable: true, width: 200 },
            { id: 'category', label: 'Category', render: (row: Scheme) => <Chip label={row.category} size="small" variant="outlined" /> },
            { id: 'department', label: 'Department', render: (row: Scheme) => row.department },
            { id: 'applicants', label: 'Applicants', render: (row: Scheme) => row.totalApplicants.toLocaleString(), sortable: true },
            { id: 'budget', label: 'Budget', render: (row: Scheme) => `₹${(row.budget / 10000000).toFixed(1)}Cr`, sortable: true },
            { id: 'status', label: 'Status', render: (row: Scheme) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} /> },
            { id: 'dates', label: 'Duration', render: (row: Scheme) => (
              <Typography variant="caption">{row.startDate} - {row.endDate}</Typography>
            )},
          ]}
          data={schemes}
          keyExtractor={(row) => row.id}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          actions={(row: Scheme) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/schemes/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => handleToggleActive(row)}>{row.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}</IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
          )}
        />
      </Box>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Delete Scheme</DialogTitle>
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
