import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Autocomplete,
  IconButton,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewIcon from '@mui/icons-material/Preview';
import type { SchemeFormData } from '@/services/schemes';

const categories = ['Agriculture', 'Housing', 'Education', 'Health', 'Social Welfare', 'Technology', 'Employment', 'Finance'];
const departments = ['Ministry of Agriculture', 'Ministry of Housing', 'Ministry of Education', 'Ministry of Health', 'Ministry of IT', 'Ministry of Women & Child', 'Ministry of Labour', 'Ministry of Finance'];
const allDocuments = ['Aadhaar Card', 'Voter ID', 'PAN Card', 'Income Certificate', 'Caste Certificate', 'Land Records', 'Bank Passbook', 'BPL Certificate', 'Ration Card', 'Domicile Certificate', 'Passport Photo', 'School ID', 'Birth Certificate', 'Marriage Certificate', 'Medical Certificate'];

export default function SchemeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<SchemeFormData>({
    name: '',
    nameHi: '',
    nameMr: '',
    nameTa: '',
    description: '',
    category: '',
    department: '',
    eligibilityCriteria: {},
    benefits: [''],
    documentRequirements: [],
    startDate: '',
    endDate: '',
    budget: 0,
  });

  const [benefits, setBenefits] = useState<string[]>(['']);
  const [criteriaEntries, setCriteriaEntries] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name) newErrors.name = 'Scheme name is required';
    if (!form.description) newErrors.description = 'Description is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.department) newErrors.department = 'Department is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.budget <= 0) newErrors.budget = 'Budget must be greater than 0';
    if (benefits.filter((b) => b.trim()).length === 0) newErrors.benefits = 'At least one benefit is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const finalForm = {
      ...form,
      benefits: benefits.filter((b) => b.trim()),
      eligibilityCriteria: Object.fromEntries(criteriaEntries.filter((e) => e.key && e.value).map((e) => [e.key, e.value])),
    };
    console.log('Submit:', finalForm);
    navigate('/schemes');
  };

  const addBenefit = () => setBenefits([...benefits, '']);
  const updateBenefit = (idx: number, value: string) => {
    const updated = [...benefits];
    updated[idx] = value;
    setBenefits(updated);
  };
  const removeBenefit = (idx: number) => {
    if (benefits.length > 1) setBenefits(benefits.filter((_, i) => i !== idx));
  };

  const addCriteriaEntry = () => setCriteriaEntries([...criteriaEntries, { key: '', value: '' }]);
  const updateCriteriaEntry = (idx: number, field: 'key' | 'value', value: string) => {
    const updated = [...criteriaEntries];
    updated[idx][field] = value;
    setCriteriaEntries(updated);
  };
  const removeCriteriaEntry = (idx: number) => {
    if (criteriaEntries.length > 1) setCriteriaEntries(criteriaEntries.filter((_, i) => i !== idx));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/schemes')}><ArrowBackIcon /></IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Scheme' : 'Create Scheme'}</Typography>
          <Typography variant="body2" color="text.secondary">{isEdit ? 'Update scheme details' : 'Add a new government scheme'}</Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Scheme Name *" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Name (Hindi)" value={form.nameHi} onChange={(e) => updateField('nameHi', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Name (Marathi)" value={form.nameMr} onChange={(e) => updateField('nameMr', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Name (Tamil)" value={form.nameTa} onChange={(e) => updateField('nameTa', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Description *" multiline rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} error={!!errors.description} helperText={errors.description} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Category *" value={form.category} onChange={(e) => updateField('category', e.target.value)} error={!!errors.category} helperText={errors.category}>
                      {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Department *" value={form.department} onChange={(e) => updateField('department', e.target.value)} error={!!errors.department} helperText={errors.department}>
                      {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Eligibility Criteria</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addCriteriaEntry}>Add Criterion</Button>
                </Box>
                {criteriaEntries.map((entry, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                    <TextField size="small" label="Field" value={entry.key} onChange={(e) => updateCriteriaEntry(idx, 'key', e.target.value)} sx={{ flex: 1 }} placeholder="e.g., income" />
                    <TextField size="small" label="Value" value={entry.value} onChange={(e) => updateCriteriaEntry(idx, 'value', e.target.value)} sx={{ flex: 1 }} placeholder="e.g., <3L" />
                    <IconButton size="small" onClick={() => removeCriteriaEntry(idx)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Benefits</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={addBenefit}>Add Benefit</Button>
                </Box>
                {errors.benefits && <Typography variant="caption" color="error">{errors.benefits}</Typography>}
                {benefits.map((benefit, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                    <TextField fullWidth size="small" label={`Benefit ${idx + 1}`} value={benefit} onChange={(e) => updateBenefit(idx, e.target.value)} placeholder="e.g., ₹6000/year" />
                    <IconButton size="small" onClick={() => removeBenefit(idx)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Document Requirements</Typography>
                <Autocomplete
                  multiple
                  options={allDocuments}
                  value={form.documentRequirements}
                  onChange={(_, val) => updateField('documentRequirements', val)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Required Documents" placeholder="Select documents" />}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Duration & Budget</Typography>
                <TextField fullWidth label="Start Date *" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} error={!!errors.startDate} helperText={errors.startDate} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="End Date *" type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} error={!!errors.endDate} helperText={errors.endDate} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="Budget (₹)" type="number" value={form.budget} onChange={(e) => updateField('budget', Number(e.target.value))} error={!!errors.budget} helperText={errors.budget} sx={{ mb: 1 }} />
              </CardContent>
            </Card>

            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Preview</Typography>
                {form.name && (
                  <Box sx={{ p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="subtitle2">{form.name}</Typography>
                    {form.nameHi && <Typography variant="caption" color="text.secondary">{form.nameHi}</Typography>}
                    <Divider sx={{ my: 1 }} />
                    {form.category && <Chip label={form.category} size="small" sx={{ mr: 0.5 }} />}
                    {form.department && <Chip label={form.department} size="small" variant="outlined" />}
                    <Typography variant="body2" sx={{ mt: 1 }}>{form.description}</Typography>
                    {benefits.filter((b) => b.trim()).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" fontWeight={600}>Benefits:</Typography>
                        {benefits.filter((b) => b.trim()).map((b, i) => (
                          <Typography key={i} variant="caption" display="block">• {b}</Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
                {!form.name && (
                  <Typography variant="body2" color="text.secondary">Fill in scheme details to see preview</Typography>
                )}
              </CardContent>
            </Card>

            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mb: 1 }}>
              {isEdit ? 'Update Scheme' : 'Create Scheme'}
            </Button>
            <Button variant="outlined" fullWidth onClick={() => navigate('/schemes')}>Cancel</Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
