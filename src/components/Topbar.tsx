import React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../state/AuthContext';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <AppBar position="fixed" color="default" elevation={0} sx={{ borderBottom: '1px solid #e5e7eb' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="text.primary">Admin Panel</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          <Button variant="outlined" size="small" onClick={logout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
