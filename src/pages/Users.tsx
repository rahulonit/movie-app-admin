import React, { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import api from '../api/client';

interface UserRow {
  _id: string;
  email: string;
  role: string;
  isBlocked?: boolean;
  subscription: { plan: string; status: string };
}

const Users: React.FC = () => {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users?limit=50', { headers: { 'Cache-Control': 'no-cache' } });
      setRows(res.data.data.users || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleBlock = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/block`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to toggle block');
    }
  };

  const makePremium = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/subscription`, { plan: 'PREMIUM', status: 'ACTIVE' });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update subscription');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Users</Typography>
        <Button variant="outlined" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Blocked</TableCell>
              <TableCell width={220}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>{row.subscription?.plan}</TableCell>
                <TableCell>{row.subscription?.status}</TableCell>
                <TableCell>{row.isBlocked ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => toggleBlock(row._id)}>{row.isBlocked ? 'Unblock' : 'Block'}</Button>
                    <Button size="small" onClick={() => makePremium(row._id)}>Make Premium</Button>
                    <Button size="small" color="error" onClick={() => deleteUser(row._id)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
};

export default Users;
