import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Skeleton,
  Stack,
  Button,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

import { 
  Public as CountriesIcon, 
  Business as CompaniesIcon, 
  People as PeopleIcon, 
  NetworkCheck as TrackingIcon,
  ShowChart as ChartIcon,
  Storage as DatabaseIcon,
  Dns as DnsIcon,
  Dvr as ServerIcon,
  NotificationsActive as ActivityIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { dashboardApi, companiesApi, peopleApi } from '../services/api';

// Colors for pie chart segments

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, icon: Icon, color, isLoading }) => {
  const hasValue = value !== null && value !== undefined;
  return (
    <Card sx={{ height: '100%', minHeight: 120, borderRadius: 3, boxShadow: 3, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
            {title}
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={100} height={36} />
          ) : hasValue ? (
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{value}</Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">No data</Typography>
          )}
        </Box>
        <Box
          sx={{
            ml: 2,
            background: (theme) => `linear-gradient(135deg, ${theme.palette[color].light} 0%, ${theme.palette[color].main} 100%)`,
            color: 'white',
            borderRadius: '16px',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 3,
          }}
        >
          <Icon fontSize="large" />
        </Box>
      </CardContent>
    </Card>
  );
};

const QuickStatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {value === null || value === undefined ? (
            <Typography variant="body2" color="textSecondary">No data</Typography>
          ) : (
            <Box display="flex" alignItems="flex-end" gap={1}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
              {subtext && (
                <Typography variant="caption" color="textSecondary">
                  {subtext}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Box
          sx={{
            background: (theme) => `linear-gradient(135deg, ${theme.palette[color].light} 0%, ${theme.palette[color].main} 100%)`,
            color: 'white',
            borderRadius: 2,
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
          }}
        >
          <Icon />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RecentActivity = ({ activities, isLoading }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardHeader title="Recent Activities" />
        <CardContent>
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Skeleton variant="rectangular" height={28} />
            <Skeleton variant="rectangular" height={28} />
            <Skeleton variant="rectangular" height={28} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader 
        title="Recent Activities" 
        avatar={<ActivityIcon color="primary" />}
      />
      <Divider />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Activity</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="textSecondary">No activity yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ActivityIcon 
                        fontSize="small" 
                        sx={{ 
                          color: theme.palette.grey[500],
                          fontSize: '1rem'
                        }} 
                      />
                      <Typography variant="body2">
                        {activity.details}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{activity.user}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={activity.type} 
                      size="small" 
                      color={
                        activity.type === 'create' ? 'success' : 
                        activity.type === 'update' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};
const Dashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    overview: true,
    activities: true
  });
  const [growthData, setGrowthData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [activityLimit, setActivityLimit] = useState(10); // default 10
  const limitOptions = [5, 10, 15, 20, 'All'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await dashboardApi.getStats();
        const statsData = statsResponse?.data?.data || {};
        setStats(statsData);
        setGrowthData(Array.isArray(statsData?.charts?.growth) ? statsData.charts.growth : []);
        setRegionData(Array.isArray(statsData?.charts?.regionDistribution) ? statsData.charts.regionDistribution : []);
        setLoading(prev => ({ ...prev, stats: false }));
        
        // Fetch system overview
        const overviewResponse = await dashboardApi.getOverview();
        setOverview(overviewResponse.data.data);
        setLoading(prev => ({ ...prev, overview: false }));
        
        // Fetch recent activities with default limit
        const activitiesResponse = await dashboardApi.getActivities({ limit: activityLimit === 'All' ? undefined : activityLimit });
        setActivities(activitiesResponse.data.data);
        setLoading(prev => ({ ...prev, activities: false }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading({ stats: false, overview: false, activities: false });
      }
    };

    fetchDashboardData();
  }, []);

  // New effect to refetch activities when activityLimit changes
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(prev => ({ ...prev, activities: true }));
      try {
        const params = activityLimit === 'All' ? {} : { limit: activityLimit };
        const activitiesResponse = await dashboardApi.getActivities(params);
        setActivities(activitiesResponse.data.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(prev => ({ ...prev, activities: false }));
      }
    };

    fetchActivities();
  }, [activityLimit]);

  return (
    <Container maxWidth={false} disableGutters sx={{ width: '100%', pb: 4 }}>
      {/* Center inner content and constrain width so items don't stretch edge-to-edge
          on ultra-wide screens. Use a centered maxWidth so cards grow naturally
          while preventing large empty gutters on very wide monitors. */}
      <Box sx={{ maxWidth: { xs: '100%', md: 1200, lg: 1400, xl: 1800 }, mx: 'auto', width: '100%', px: { xs: 2, md: 4 } }}>
      <Card
        sx={{
          mb: 3,
          width: '100%',
          borderRadius: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          boxShadow: 4,
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                Global Tracker
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 1 }}>
                Overview of system metrics and recent activity
              </Typography>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Data freshness</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{stats ? 'Live' : 'Loading...'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ bgcolor: 'rgba(255,255,255,0.06)', p: 1.25, borderRadius: 2 }}>
                  <Chip label={`Countries: ${stats?.totalCountries ?? '—'}`} color="default" sx={{ bgcolor: 'transparent', color: 'white' }} />
                  <Chip label={`Companies: ${stats?.totalCompanies ?? '—'}`} color="default" sx={{ bgcolor: 'transparent', color: 'white' }} />
                  <Chip label={`People: ${stats?.totalPeople ?? '—'}`} color="default" sx={{ bgcolor: 'transparent', color: 'white' }} />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" color="inherit" onClick={async () => {
                    let html = null;
                    try {
                      const { createAllCompaniesPrintElement, printHTMLString } = await import('../utils/printUtils');
                      // Remove previous generated prints to avoid duplication
                      document.querySelectorAll('.generated-print').forEach(el => { try { el.remove(); } catch (e) {} });
                      const serverBase = (process.env.REACT_APP_API_URL && String(process.env.REACT_APP_API_URL).replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '')) || window.location.origin.replace(/:\d+$/, ':5000');
                      const el = await createAllCompaniesPrintElement(companiesApi.getAll, peopleApi.getAll, serverBase);
                      html = el.outerHTML;
                      console.debug('Dashboard export: generated HTML length', html.length);
                      // Use iframe-based printing to ensure rendering before printing
                      await printHTMLString(html);
                      console.debug('Dashboard export: print completed');
                    } catch (err) {
                      console.error('Export all failed:', err);
                      console.error('Export all failed, attempting fallback window.open print.', err);
                      try {
                        if (html) {
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.open();
                            win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title></head><body>${html}</body></html>`);
                            win.document.close();
                            setTimeout(() => { try { win.focus(); win.print(); } catch (e) { console.error('Fallback print failed', e); } }, 600);
                            setTimeout(() => { try { win.close(); } catch (e) {} }, 4000);
                          } else {
                            window.print();
                          }
                        } else {
                          window.print();
                        }
                      } catch (e) {
                        console.error('Fallback export print failed', e);
                        window.print();
                      }
                    }
                  }} sx={{ borderColor: 'rgba(255,255,255,0.18)' }}>Export</Button>
                  <Button variant="contained" color="secondary" onClick={() => window.location.reload()}>Refresh</Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Stats */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <StatCard 
             title="Total Countries" 
             value={loading.stats ? '...' : stats?.totalCountries || 0} 
             icon={CountriesIcon} 
             color="primary"
             isLoading={loading.stats}
           />
         </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <StatCard 
             title="Total Companies" 
             value={loading.stats ? '...' : stats?.totalCompanies || 0} 
             icon={CompaniesIcon} 
             color="secondary"
             isLoading={loading.stats}
           />
         </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <StatCard 
             title="Total People" 
             value={loading.stats ? '...' : stats?.totalPeople || 0} 
             icon={PeopleIcon} 
             color="info"
             isLoading={loading.stats}
           />
         </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <StatCard 
             title="Active Tracking" 
             value={loading.stats ? '...' : stats?.activeTracking || 0} 
             icon={TrackingIcon} 
             color="success"
             isLoading={loading.stats}
           />
         </Grid>
       </Grid>
      
      {/* Quick Stats */}
      <Typography variant="h6" gutterBottom>
        Quick Stats
      </Typography>
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3} lg={3} xl={2} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <QuickStatCard 
             title="Avg Companies per Country"
             value={loading.stats ? '...' : stats?.quickStats?.avgCompaniesPerCountry?.toFixed(2) || '0'}
             icon={ChartIcon}
             color="primary"
           />
         </Grid>
        <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <QuickStatCard 
             title="Avg People per Company"
             value={loading.stats ? '...' : stats?.quickStats?.avgPeoplePerCompany?.toFixed(2) || '0'}
             icon={PeopleIcon}
             color="secondary"
           />
         </Grid>
        <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <QuickStatCard 
             title="Total IP Addresses"
             value={loading.stats ? '...' : stats?.quickStats?.totalIPs || 0}
             icon={DnsIcon}
             color="info"
           />
         </Grid>
        <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
           <QuickStatCard 
             title="Total Subdomains"
             value={loading.stats ? '...' : stats?.quickStats?.totalSubdomains || 0}
             icon={ServerIcon}
             color="success"
           />
         </Grid>
       </Grid>
      
      {/* Responsive layout: Growth and Distribution side-by-side on md+ */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }} alignItems="stretch">
        {/* Growth: primary column (takes more space on larger screens) */}
        <Grid item xs={12} md={8} lg={3} xl={2} >
          <Card sx={{ borderRadius: 3, mb: 3, width: 850, height: '100%' }}>
            <CardHeader 
              title="Growth Overview" 
              subheader="Companies and People Growth"
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {growthData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: { xs: 320, md: 480 }, p: 2 }}>
                  <Typography variant="body2" color="textSecondary">No growth data yet.</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: { xs: 320, md: 480 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={growthData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="companies" fill={theme.palette.primary.main} name="Companies" />
                      <Bar dataKey="people" fill={theme.palette.secondary.main} name="People" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribution: secondary column (right side on md+) */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, borderRadius: 3, width: 850, height: '100%' }}>
            <CardHeader 
              title="Distribution by Region" 
              subheader="Companies by Region"
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {regionData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: { xs: 320, md: 480 } }}>
                  <Typography variant="body2" color="textSecondary">No region distribution data.</Typography>
                </Box>
              ) : (
                <Box sx={{ width: 800, height: { xs: 320, md: 480 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={Math.min(120, typeof window !== 'undefined' ? Math.floor((window.innerWidth || 800) / 6) : 120)}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
