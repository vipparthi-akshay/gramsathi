import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { chartColors } from '@/theme/theme';

const impactMetrics = [
  { label: 'Citizens Reached', value: '1,25,000', icon: 'people', color: '#1565C0', change: '+15%' },
  { label: 'Benefits Accessed', value: '89,500', icon: 'check_circle', color: '#2E7D32', change: '+22%' },
  { label: 'Scheme Awareness', value: '78%', icon: 'trending_up', color: '#F57F17', change: '+8%' },
  { label: 'Satisfaction Rate', value: '4.2/5', icon: 'star', color: '#0288D1', change: '+5%' },
];

const languageData = [
  { language: 'Hindi', count: 45000, percentage: 36 },
  { language: 'Marathi', count: 18000, percentage: 14.4 },
  { language: 'Tamil', count: 15000, percentage: 12 },
  { language: 'Bengali', count: 12000, percentage: 9.6 },
  { language: 'Telugu', count: 10000, percentage: 8 },
  { language: 'Kannada', count: 8000, percentage: 6.4 },
  { language: 'Gujarati', count: 7000, percentage: 5.6 },
  { language: 'Others', count: 10000, percentage: 8 },
];

const schemeCategoryData = [
  { name: 'Agriculture', value: 35 },
  { name: 'Housing', value: 20 },
  { name: 'Education', value: 15 },
  { name: 'Health', value: 12 },
  { name: 'Social Welfare', value: 10 },
  { name: 'Technology', value: 8 },
];

const aiPerformance = {
  autoApproved: 1250,
  suggestionsMade: 3400,
  accuracy: 94.2,
  avgConfidence: 87.5,
};

export default function Analytics() {
  const [exporting, setExporting] = useState(false);

  const handleExport = (format: string) => {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Analytics & Reports</Typography>
          <Typography variant="body2" color="text.secondary">Compliance and impact metrics for all schemes</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExport('csv')} disabled={exporting}>
            CSV
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExport('pdf')} disabled={exporting}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => handleExport('image')} disabled={exporting}>
            Image
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {impactMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{metric.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{metric.value}</Typography>
                    <Typography variant="caption" sx={{ color: metric.color, fontWeight: 600 }}>
                      {metric.change} vs last month
                    </Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: `${metric.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-icons" style={{ color: metric.color, fontSize: 22 }}>{metric.icon}</span>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Language Usage Distribution</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={languageData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="language" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1565C0" radius={[4, 4, 0, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Scheme Categories Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={schemeCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                  >
                    {schemeCategoryData.map((_, idx) => (
                      <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>AI Performance Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565C0' }}>{aiPerformance.autoApproved}</Typography>
                    <Typography variant="caption" color="text.secondary">Auto-Approved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>{aiPerformance.suggestionsMade}</Typography>
                    <Typography variant="caption" color="text.secondary">Suggestions Made</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#F57F17' }}>{aiPerformance.accuracy}%</Typography>
                    <Typography variant="caption" color="text.secondary">Accuracy Rate</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0288D1' }}>{aiPerformance.avgConfidence}%</Typography>
                    <Typography variant="caption" color="text.secondary">Avg. Confidence</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Geographic Reach (Top States)</Typography>
              <Box>
                {[
                  { state: 'Uttar Pradesh', percentage: 22, color: '#1565C0' },
                  { state: 'Maharashtra', percentage: 18, color: '#1976D2' },
                  { state: 'Bihar', percentage: 15, color: '#42A5F5' },
                  { state: 'Madhya Pradesh', percentage: 12, color: '#90CAF9' },
                  { state: 'Rajasthan', percentage: 10, color: '#BBDEFB' },
                ].map((item) => (
                  <Box key={item.state} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="body2">{item.state}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.percentage}%</Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 8, backgroundColor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ width: `${item.percentage}%`, height: '100%', backgroundColor: item.color, borderRadius: 4 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
