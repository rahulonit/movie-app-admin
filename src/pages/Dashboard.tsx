import React, { useEffect, useState } from 'react';
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import api from '../api/client';

const COLORS = ['#0f62fe', '#36cfc9', '#ffa940', '#722ed1', '#eb2f96', '#52c41a'];

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h5" fontWeight={600}>{value}</Typography>
  </Paper>
);

type DashboardData = {
  totalUsers: number;
  activeSubscriptions: number;
  totalMovies: number;
  totalSeries: number;
  totalWatchTime: number;
  dailyActiveUsers: number;
};

type ViewsPerDay = { _id: string; count: number };
type UserGrowth = { _id: string; count: number };
type ContentDistribution = { movies: number; series: number };
type GenreDistribution = { _id: string; count: number }[];
type TopItem = { title: string; views?: number; totalViews?: number };

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [views, setViews] = useState<ViewsPerDay[]>([]);
  const [growth, setGrowth] = useState<UserGrowth[]>([]);
  const [contentDist, setContentDist] = useState<ContentDistribution | null>(null);
  const [genreDist, setGenreDist] = useState<GenreDistribution>([]);
  const [topMovies, setTopMovies] = useState<TopItem[]>([]);
  const [topSeries, setTopSeries] = useState<TopItem[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [dash, viewsRes, distRes, genreRes, growthRes, topRes] = await Promise.all([
        api.get('/admin/analytics/dashboard'),
        api.get('/admin/analytics/views-per-day'),
        api.get('/admin/analytics/content-distribution'),
        api.get('/admin/analytics/genre-distribution'),
        api.get('/admin/analytics/user-growth'),
        api.get('/admin/analytics/top-content')
      ]);

      setStats(dash.data.data);
      setViews(viewsRes.data.data.viewsPerDay || []);
      setContentDist(distRes.data.data);
      setGenreDist(genreRes.data.data.genreDistribution || []);
      setGrowth(growthRes.data.data.userGrowth || []);
      setTopMovies(topRes.data.data.topMovies || []);
      setTopSeries(topRes.data.data.topSeries || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Users" value={stats?.totalUsers ?? '--'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Premium Users" value={stats?.activeSubscriptions ?? '--'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Published Movies" value={stats?.totalMovies ?? '--'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Published Series" value={stats?.totalSeries ?? '--'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Daily Active" value={stats?.dailyActiveUsers ?? '--'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Watch Time (min)" value={stats?.totalWatchTime ?? '--'} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6">Views (30d)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={views}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0f62fe" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6">User Growth (30d)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#36cfc9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6">Content Mix</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie dataKey="value" data={[
                  { name: 'Movies', value: contentDist?.movies ?? 0 },
                  { name: 'Series', value: contentDist?.series ?? 0 }
                ]} innerRadius={50} outerRadius={90} paddingAngle={4}>
                  {[0,1].map((i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Chip size="small" label={`Movies: ${contentDist?.movies ?? 0}`} />
              <Chip size="small" label={`Series: ${contentDist?.series ?? 0}`} />
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="h6">Genres</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie dataKey="count" data={genreDist} nameKey="_id" innerRadius={50} outerRadius={90}>
                  {genreDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: 320, overflow: 'auto' }}>
            <Typography variant="h6">Top Content</Typography>
            <Box mt={2}>
              <Typography variant="subtitle2">Movies</Typography>
              {topMovies.map((m, idx) => (
                <Stack key={m.title + idx} direction="row" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{m.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{m.views ?? 0} views</Typography>
                </Stack>
              ))}
            </Box>
            <Box mt={2}>
              <Typography variant="subtitle2">Series</Typography>
              {topSeries.map((s, idx) => (
                <Stack key={s.title + idx} direction="row" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.totalViews ?? 0} views</Typography>
                </Stack>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default Dashboard;
