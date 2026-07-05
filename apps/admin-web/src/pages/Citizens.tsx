import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import GramTable from '@/components/Data/GramTable';
import GramFilterBar from '@/components/Data/GramFilterBar';
import StatusBadge from '@/components/Data/StatusBadge';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import type { Citizen } from '@/services/citizens';

const mockCitizens: Citizen[] = Array.from({ length: 50 }, (_, i) => ({
  id: `CIT-${String(1000 + i)}`,
  name: ['Ramesh Singh', 'Sita Devi', 'Mohan Lal', 'Geeta Verma', 'Arun Kumar', 'Priya Patel', 'Vikram Sharma', 'Anita Desai', 'Suresh Reddy', 'Lakshmi Nair'][i % 10],
  phone: `987654${String(3000 + i).slice(0, 4)}`,
  aadhaar: `${String(1234 + i * 111).slice(0, 4)}-${String(5678 + i * 222).slice(0, 4)}-${String(9012 + i * 333).slice(0, 4)}`,
  email: i % 3 === 0 ? `user${i}@email.com` : undefined,
  age: 25 + (i % 50),
  gender: i % 2 === 0 ? 'male' : 'female',
  state: ['Uttar Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan', 'Madhya Pradesh'][i % 5],
  district: ['Lucknow', 'Mumbai', 'Patna', 'Jaipur', 'Bhopal'][i % 5],
  block: ['Block A', 'Block B', 'Block C'][i % 3],
  village: `Village ${String.fromCharCode(65 + (i % 10))}`,
  address: `Village ${String.fromCharCode(65 + (i % 10))}, Block ${['A', 'B', 'C'][i % 3]}`,
  isVerified: i % 4 !== 0,
  preferredLanguage: ['Hindi', 'Marathi', 'Tamil', 'English'][i % 4],
  familyMembers: [],
  createdAt: new Date(2024, 0, 10 + i).toISOString(),
  updatedAt: new Date().toISOString(),
}));

const indianStates = [
  'Uttar Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan', 'Madhya Pradesh',
  'Tamil Nadu', 'Karnataka', 'Gujarat', 'West Bengal', 'Odisha',
];

export default function Citizens() {
  const navigate = useNavigate();
  const { filters, setFilter, clearFilters } = useFilters();
  const debouncedSearch = useDebounce(filters.search);
  const pagination = usePagination(10);
  const [citizens, setCitizens] = useState<Citizen[]>([]);

  useEffect(() => {
    let filtered = [...mockCitizens];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.aadhaar.includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    if (filters.state) filtered = filtered.filter((c) => c.state === filters.state);
    if (filters.district) filtered = filtered.filter((c) => c.district.toLowerCase().includes(filters.district.toLowerCase()));
    if (filters.status) filtered = filtered.filter((c) => filters.status === 'verified' ? c.isVerified : !c.isVerified);
    pagination.setTotal(filtered.length);
    const start = (pagination.page - 1) * pagination.limit;
    setCitizens(filtered.slice(start, start + pagination.limit));
  }, [debouncedSearch, filters.state, filters.district, filters.status, pagination.page, pagination.limit]);

  const handleVerify = (id: string) => {
    setCitizens((prev) => prev.map((c) => c.id === id ? { ...c, isVerified: true } : c));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Citizens</Typography>
          <Typography variant="body2" color="text.secondary">View and manage citizen profiles</Typography>
        </Box>
      </Box>

      <GramFilterBar
        filters={filters}
        onFilterChange={setFilter}
        onClear={clearFilters}
        showStateDistrict
        showStatus
        statusOptions={[
          { value: 'verified', label: 'Verified' },
          { value: 'unverified', label: 'Unverified' },
        ]}
        placeholder="Search by name, phone or Aadhaar..."
      />

      <Box sx={{ mt: 2 }}>
        <GramTable
          columns={[
            { id: 'name', label: 'Name', render: (row: Citizen) => (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                <Typography variant="caption" color="text.secondary">{row.id}</Typography>
              </Box>
            ), sortable: true },
            { id: 'phone', label: 'Phone', render: (row: Citizen) => row.phone },
            { id: 'aadhaar', label: 'Aadhaar', render: (row: Citizen) => row.aadhaar },
            { id: 'location', label: 'Location', render: (row: Citizen) => (
              <Typography variant="body2">{row.village}, {row.district}</Typography>
            ) },
            { id: 'language', label: 'Language', render: (row: Citizen) => row.preferredLanguage },
            { id: 'age', label: 'Age', render: (row: Citizen) => row.age, sortable: true },
            { id: 'verified', label: 'Status', render: (row: Citizen) => <StatusBadge status={row.isVerified ? 'verified' : 'unverified'} /> },
          ]}
          data={citizens}
          keyExtractor={(row) => row.id}
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          onPageChange={pagination.setPage}
          onLimitChange={pagination.setLimit}
          actions={(row: Citizen) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="View Profile"><IconButton size="small" onClick={() => navigate(`/citizens/${row.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
              {!row.isVerified && (
                <Tooltip title="Verify"><IconButton size="small" onClick={() => handleVerify(row.id)} color="success"><VerifiedIcon fontSize="small" /></IconButton></Tooltip>
              )}
            </Box>
          )}
        />
      </Box>
    </Box>
  );
}
