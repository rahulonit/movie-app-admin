import React, { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import api from '../api/client';

interface HealthState {
  cloudinary: { ok: boolean; message: string };
  mux: { ok: boolean; message: string };
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
        <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
          <Alert severity={data.cloudinary.ok ? 'success' : 'error'}>
            Cloudinary: {data.cloudinary.message}
          </Alert>
          <Alert severity={data.mux.ok ? 'success' : 'error'}>
            Mux: {data.mux.message}
          </Alert>
        </Paper>
      )}
    </Stack>
  );
};

export default Health;
