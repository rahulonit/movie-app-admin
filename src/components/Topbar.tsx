import React, { useEffect, useState } from 'react';
import { AppBar, Box, Button, Chip, Toolbar, Tooltip, Typography } from '@mui/material';
import api from '../api/client';
import { useAuth } from '../state/AuthContext';

type HealthStatus = 'loading' | 'ok' | 'error';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<{ status: HealthStatus; message: string }>({ status: 'loading', message: 'Checking…' });

  const checkHealth = async () => {
    try {
      setHealth({ status: 'loading', message: 'Checking…' });
      const res = await api.get('/health');
      const ok = res.data?.status === 'ok';
      setHealth({ status: ok ? 'ok' : 'error', message: ok ? 'API reachable' : 'API unreachable' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'API unreachable';
      setHealth({ status: 'error', message: msg });
    }
  };

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 60000);
    return () => clearInterval(id);
  }, []);
  return (
    <AppBar position="fixed" color="default" elevation={0} sx={{ borderBottom: '1px solid #e5e7eb' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="text.primary">Admin Panel</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={health.message} placement="bottom">
            <Chip
              size="small"
              label={health.status === 'loading' ? 'Checking' : health.status === 'ok' ? 'Online' : 'Offline'}
              color={health.status === 'ok' ? 'success' : health.status === 'loading' ? 'default' : 'error'}
              variant="outlined"
              onClick={checkHealth}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          <Button variant="outlined" size="small" onClick={logout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
