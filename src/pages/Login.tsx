import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../state/AuthContext';

const Login: React.FC = () => {
  const { login, logout, loading } = useAuth();
  const navigate = useNavigate();
  // Prefill with the known admin test user created on the deployed API.
  const [email, setEmail] = useState('admin.test@example.com');
  const [password, setPassword] = useState('AdminTest123');
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear any stale session when hitting the login page.
    logout();
  }, [logout]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: 360 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Admin Login</Typography>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Use the deployed admin account"
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="AdminTest123"
              required
            />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
