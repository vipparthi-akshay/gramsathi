import { Card, CardContent, Typography, Box, Tooltip as MuiTooltip } from '@mui/material';
import { useState } from 'react';

interface StateData {
  name: string;
  applications: number;
  approved: number;
  citizens: number;
}

const stateData: StateData[] = [
  { name: 'Uttar Pradesh', applications: 452, approved: 321, citizens: 12500 },
  { name: 'Maharashtra', applications: 389, approved: 278, citizens: 10800 },
  { name: 'Bihar', applications: 356, approved: 245, citizens: 9800 },
  { name: 'Madhya Pradesh', applications: 298, approved: 210, citizens: 8700 },
  { name: 'Rajasthan', applications: 267, approved: 189, citizens: 7600 },
  { name: 'Tamil Nadu', applications: 234, approved: 178, citizens: 6900 },
  { name: 'Karnataka', applications: 212, approved: 156, citizens: 6500 },
  { name: 'Gujarat', applications: 198, approved: 145, citizens: 5800 },
  { name: 'West Bengal', applications: 187, approved: 134, citizens: 5400 },
  { name: 'Odisha', applications: 156, approved: 112, citizens: 4300 },
  { name: 'Telangana', applications: 145, approved: 108, citizens: 3900 },
  { name: 'Andhra Pradesh', applications: 134, approved: 95, citizens: 3600 },
  { name: 'Kerala', applications: 98, approved: 72, citizens: 2800 },
  { name: 'Punjab', applications: 87, approved: 65, citizens: 2400 },
  { name: 'Haryana', applications: 76, approved: 54, citizens: 2100 },
  { name: 'Delhi', applications: 145, approved: 102, citizens: 4200 },
  { name: 'Jharkhand', applications: 123, approved: 87, citizens: 3400 },
  { name: 'Chhattisgarh', applications: 112, approved: 78, citizens: 3100 },
  { name: 'Assam', applications: 98, approved: 67, citizens: 2600 },
  { name: 'Himachal Pradesh', applications: 45, approved: 34, citizens: 1200 },
];

function getIntensity(applications: number): string {
  if (applications > 400) return '#1565C0';
  if (applications > 300) return '#1976D2';
  if (applications > 200) return '#42A5F5';
  if (applications > 100) return '#90CAF9';
  return '#BBDEFB';
}

const simplifiedMap: { name: string; x: number; y: number; w: number; h: number }[] = [
  { name: 'Jammu & Kashmir', x: 180, y: 10, w: 50, h: 40 },
  { name: 'Himachal Pradesh', x: 185, y: 55, w: 35, h: 25 },
  { name: 'Punjab', x: 160, y: 65, w: 35, h: 25 },
  { name: 'Uttarakhand', x: 200, y: 70, w: 35, h: 30 },
  { name: 'Haryana', x: 165, y: 85, w: 35, h: 20 },
  { name: 'Delhi', x: 182, y: 85, w: 15, h: 15 },
  { name: 'Rajasthan', x: 120, y: 90, w: 55, h: 70 },
  { name: 'Uttar Pradesh', x: 200, y: 90, w: 70, h: 55 },
  { name: 'Gujarat', x: 110, y: 150, w: 55, h: 50 },
  { name: 'Madhya Pradesh', x: 170, y: 135, w: 70, h: 55 },
  { name: 'Bihar', x: 270, y: 100, w: 50, h: 35 },
  { name: 'West Bengal', x: 300, y: 115, w: 45, h: 50 },
  { name: 'Jharkhand', x: 260, y: 140, w: 50, h: 40 },
  { name: 'Chhattisgarh', x: 220, y: 165, w: 55, h: 45 },
  { name: 'Odisha', x: 275, y: 175, w: 50, h: 45 },
  { name: 'Maharashtra', x: 130, y: 185, w: 80, h: 55 },
  { name: 'Telangana', x: 200, y: 235, w: 55, h: 40 },
  { name: 'Andhra Pradesh', x: 210, y: 265, w: 50, h: 50 },
  { name: 'Karnataka', x: 160, y: 265, w: 55, h: 50 },
  { name: 'Tamil Nadu', x: 190, y: 305, w: 55, h: 50 },
  { name: 'Kerala', x: 175, y: 335, w: 30, h: 40 },
  { name: 'Assam', x: 330, y: 50, w: 55, h: 35 },
  { name: 'Nagaland', x: 370, y: 40, w: 30, h: 25 },
];

export default function GeoHeatMap() {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const dataMap = new Map(stateData.map((d) => [d.name, d]));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Geographic Reach
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 400px', minHeight: 380, position: 'relative' }}>
            <svg viewBox="0 0 420 400" style={{ width: '100%', maxHeight: 380 }}>
              {simplifiedMap.map((state) => {
                const data = dataMap.get(state.name);
                const color = data ? getIntensity(data.applications) : '#E0E0E0';
                const isHovered = hoveredState === state.name;

                return (
                  <MuiTooltip
                    key={state.name}
                    title={
                      data ? (
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{state.name}</Typography>
                          <Typography variant="caption">Applications: {data.applications}</Typography>
                          <br />
                          <Typography variant="caption">Approved: {data.approved}</Typography>
                          <br />
                          <Typography variant="caption">Citizens: {data.citizens.toLocaleString()}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2">{state.name}</Typography>
                      )
                    }
                  >
                    <g>
                      <rect
                        x={state.x}
                        y={state.y}
                        width={state.w}
                        height={state.h}
                        rx={3}
                        fill={color}
                        stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}
                        strokeWidth={isHovered ? 2 : 0.5}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={() => setHoveredState(state.name)}
                        onMouseLeave={() => setHoveredState(null)}
                      />
                      <text
                        x={state.x + state.w / 2}
                        y={state.y + state.h / 2 + 3}
                        textAnchor="middle"
                        fill={data && data.applications > 200 ? '#fff' : '#666'}
                        fontSize="7"
                        fontWeight={500}
                      >
                        {state.name.length > 8 ? state.name.substring(0, 6) + '..' : state.name}
                      </text>
                    </g>
                  </MuiTooltip>
                );
              })}
            </svg>
          </Box>

          <Box sx={{ minWidth: 160 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Legend</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                { label: '> 400', color: '#1565C0' },
                { label: '200-400', color: '#42A5F5' },
                { label: '100-200', color: '#90CAF9' },
                { label: '< 100', color: '#BBDEFB' },
                { label: 'No data', color: '#E0E0E0' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: 0.5, backgroundColor: item.color }} />
                  <Typography variant="caption">{item.label}</Typography>
                </Box>
              ))}
            </Box>

            {hoveredState && dataMap.has(hoveredState) && (
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{hoveredState}</Typography>
                {(() => {
                  const d = dataMap.get(hoveredState)!;
                  return (
                    <>
                      <Typography variant="caption" display="block">Apps: {d.applications}</Typography>
                      <Typography variant="caption" display="block">Approved: {d.approved}</Typography>
                      <Typography variant="caption" display="block">Citizens: {d.citizens.toLocaleString()}</Typography>
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
