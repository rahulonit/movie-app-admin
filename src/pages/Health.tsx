import React, { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../api/client';

interface HealthState {
  cloudinary: { ok: boolean; message: string };
  cloudflare: { ok: boolean; message: string };
}

const Health: React.FC = () => {
  const [data, setData] = useState<HealthState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/integrations/health');
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Integrations Health</Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>{loading ? 'Checking…' : 'Re-run'}</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {data && (
        <Paper sx={{ p: 3, display: 'grid', gap: 2 }}>
          {/* Cloudinary */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Cloudinary</Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>{data.cloudinary.message}</Typography>
            </Stack>
            <Chip
              icon={data.cloudinary.ok ? <CheckCircleIcon /> : <CancelIcon />}
              label={data.cloudinary.ok ? 'Connected' : 'Disconnected'}
              color={data.cloudinary.ok ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          {/* Cloudflare Stream */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Cloudflare Stream</Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>{data.cloudflare.message}</Typography>
            </Stack>
            <Chip
              icon={data.cloudflare.ok ? <CheckCircleIcon /> : <CancelIcon />}
              label={data.cloudflare.ok ? 'Connected' : 'Disconnected'}
              color={data.cloudflare.ok ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>

          {/* Overall Status */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Alert severity={data.cloudinary.ok && data.cloudflare.ok ? 'success' : 'warning'}>
              {data.cloudinary.ok && data.cloudflare.ok
                ? '✅ All integrations are operational'
                : '⚠️ Some integrations are not available'}
            </Alert>
          </Box>
        </Paper>
      )}
    </Stack>
  );
};

export default Health;
