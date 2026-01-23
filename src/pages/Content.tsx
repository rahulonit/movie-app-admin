import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import api from '../api/client';

interface MovieRow {
  _id: string;
  title: string;
  isPublished: boolean;
  isPremium: boolean;
  language?: string;
  releaseYear?: number;
  muxPlaybackId?: string;
}

type MoviePayload = {
  title: string;
  description: string;
  genres: string[];
  language: string;
  releaseYear: number;
  duration: number;
  rating?: number;
  poster: { vertical: string; horizontal: string };
  trailerUrl?: string;
  muxPlaybackId: string;
  muxAssetId: string;
  maturityRating: 'U' | 'UA' | 'A';
  isPremium: boolean;
};

const GENRES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Thriller',
  'Romance',
  'Sci-Fi',
  'Fantasy',
  'Documentary',
  'Animation',
  'Crime',
  'Mystery',
  'Adventure',
  'Family',
  'Musical',
  'War',
  'Western',
  'Biography',
  'Sports'
];

const LANGUAGES = [
  'English',
  'हिंदी',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Punjabi'
];

const MATURITY_RATINGS: Array<'U' | 'UA' | 'A'> = ['U', 'UA', 'A'];

const emptyMovie = (): MoviePayload => ({
  title: '',
  description: '',
  genres: [],
  language: '',
  releaseYear: new Date().getFullYear(),
  duration: 0,
  rating: 0,
  poster: { vertical: '', horizontal: '' },
  trailerUrl: '',
  muxPlaybackId: '',
  muxAssetId: '',
  maturityRating: 'U',
  isPremium: false
});

const Content: React.FC = () => {
  const [rows, setRows] = useState<MovieRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<MoviePayload>(emptyMovie());
  const [editingId, setEditingId] = useState<string | null>(null);
  const dialogTitle = useMemo(() => (editingId ? 'Edit Movie' : 'Create Movie'), [editingId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/movies?limit=50', { headers: { 'Cache-Control': 'no-cache' } });
      setRows(res.data.data.movies || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyMovie());
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (movie: any) => {
    setEditingId(movie._id);
    setForm({
      title: movie.title || '',
      description: movie.description || '',
      genres: movie.genres || [],
      language: movie.language || '',
      releaseYear: movie.releaseYear || new Date().getFullYear(),
      duration: movie.duration || 0,
      rating: movie.rating || 0,
      poster: movie.poster || { vertical: '', horizontal: '' },
      trailerUrl: movie.trailerUrl || '',
      muxPlaybackId: movie.muxPlaybackId || '',
      muxAssetId: movie.muxAssetId || '',
      maturityRating: movie.maturityRating || 'U',
      isPremium: movie.isPremium || false
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setFieldErrors({});
    try {
      const missing: string[] = [];
      const nextFieldErrors: Record<string, string> = {};
      if (!form.title) missing.push('title');
      if (!form.description) missing.push('description');
      if (!form.genres.length) missing.push('genres');
      if (!form.language) missing.push('language');
      if (!form.releaseYear) missing.push('releaseYear');
      if (!form.duration) missing.push('duration');
      if (!form.poster.vertical || !form.poster.horizontal) missing.push('poster URLs');
      if (!form.muxPlaybackId || !form.muxAssetId) missing.push('Mux IDs');
      if (!['U', 'UA', 'A'].includes(form.maturityRating)) missing.push('maturity rating');

      if (!form.title) nextFieldErrors.title = 'Title is required';
      if (!form.description) nextFieldErrors.description = 'Description is required';
      if (!form.genres.length) nextFieldErrors.genres = 'Select at least one genre';
      if (!form.language) nextFieldErrors.language = 'Language is required';
      if (!form.releaseYear) nextFieldErrors.releaseYear = 'Release year is required';
      if (!form.duration) nextFieldErrors.duration = 'Duration is required';
      if (!form.poster.vertical) nextFieldErrors.posterVertical = 'Vertical poster URL required';
      if (!form.poster.horizontal) nextFieldErrors.posterHorizontal = 'Horizontal poster URL required';
      if (!form.muxPlaybackId) nextFieldErrors.muxPlaybackId = 'Mux playback ID required';
      if (!form.muxAssetId) nextFieldErrors.muxAssetId = 'Mux asset ID required';
      if (!['U', 'UA', 'A'].includes(form.maturityRating)) nextFieldErrors.maturityRating = 'Select U, UA, or A';

      if (missing.length) {
        setFieldErrors(nextFieldErrors);
        setError(`Missing required: ${missing.join(', ')}`);
        return;
      }

      const sanitizedGenres = form.genres.filter((g) => GENRES.includes(g)).slice(0, 5);
      if (sanitizedGenres.length !== form.genres.length) {
        setFieldErrors({ ...nextFieldErrors, genres: 'Pick from the list (max 5).' });
        setError('Please select valid genres from the list (max 5).');
        return;
      }

      if (!LANGUAGES.includes(form.language)) {
        setFieldErrors({ ...nextFieldErrors, language: 'Pick a valid language.' });
        setError('Please select a valid language.');
        return;
      }

      const payload = {
        ...form,
        genres: sanitizedGenres,
        language: form.language
      };
      
      // Debug: log Mux IDs being sent
      console.log('[Content] Movie payload:', {
        title: payload.title,
        muxPlaybackId: payload.muxPlaybackId,
        muxAssetId: payload.muxAssetId,
        fullPayload: payload
      });
      
      if (editingId) {
        await api.put(`/admin/movies/${editingId}`, payload);
      } else {
        await api.post('/admin/movies', payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this movie?')) return;
    try {
      await api.delete(`/admin/movies/${id}`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed');
    }
  };

  const updateField = (key: keyof MoviePayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Movies</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
          <Button variant="contained" onClick={openCreate}>Add Movie</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Premium</TableCell>
              <TableCell>Status</TableCell>
              <TableCell width={180}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.releaseYear || '-'}</TableCell>
                <TableCell>{row.isPremium ? 'Yes' : 'No'}</TableCell>
                <TableCell>{row.isPublished ? 'Published' : 'Draft'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => openEdit(row)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(row._id)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} required fullWidth />
          <TextField label="Title" value={form.title} onChange={(e) => updateField('title', e.target.value)} required fullWidth error={!!fieldErrors.title} helperText={fieldErrors.title} />
          <TextField label="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} multiline minRows={2} fullWidth error={!!fieldErrors.description} helperText={fieldErrors.description} />
          <Autocomplete
            multiple
            options={GENRES}
            value={form.genres}
            onChange={(_, value) => updateField('genres', value.slice(0, 5))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Genres"
                placeholder="Select up to 5"
                error={!!fieldErrors.genres}
                helperText={fieldErrors.genres}
              />
            )}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2 }}>
            <TextField select label="Language" value={form.language} onChange={(e) => updateField('language', e.target.value)} error={!!fieldErrors.language} helperText={fieldErrors.language}>
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </TextField>
            <TextField label="Release Year" type="number" value={form.releaseYear} onChange={(e) => updateField('releaseYear', Number(e.target.value))} error={!!fieldErrors.releaseYear} helperText={fieldErrors.releaseYear} />
            <TextField label="Duration (min)" type="number" value={form.duration} onChange={(e) => updateField('duration', Number(e.target.value))} error={!!fieldErrors.duration} helperText={fieldErrors.duration} />
            <TextField label="Rating" type="number" value={form.rating ?? 0} onChange={(e) => updateField('rating', Number(e.target.value))} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
            <TextField label="Poster Vertical URL" value={form.poster.vertical} onChange={(e) => updateField('poster', { ...form.poster, vertical: e.target.value })} error={!!fieldErrors.posterVertical} helperText={fieldErrors.posterVertical} />
            <TextField label="Poster Horizontal URL" value={form.poster.horizontal} onChange={(e) => updateField('poster', { ...form.poster, horizontal: e.target.value })} error={!!fieldErrors.posterHorizontal} helperText={fieldErrors.posterHorizontal} />
          </Box>
          <TextField label="Trailer URL" value={form.trailerUrl} onChange={(e) => updateField('trailerUrl', e.target.value)} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
            <TextField label="Mux Playback ID" value={form.muxPlaybackId} onChange={(e) => updateField('muxPlaybackId', e.target.value)} error={!!fieldErrors.muxPlaybackId} helperText={fieldErrors.muxPlaybackId} />
            <TextField label="Mux Asset ID" value={form.muxAssetId} onChange={(e) => updateField('muxAssetId', e.target.value)} error={!!fieldErrors.muxAssetId} helperText={fieldErrors.muxAssetId} />
            <TextField select label="Maturity Rating" value={form.maturityRating} onChange={(e) => updateField('maturityRating', e.target.value as any)} error={!!fieldErrors.maturityRating} helperText={fieldErrors.maturityRating}>
              {MATURITY_RATINGS.map((rate) => (
                <MenuItem key={rate} value={rate}>{rate}</MenuItem>
              ))}
            </TextField>
          </Box>
          <FormControlLabel control={<Switch checked={form.isPremium} onChange={(e) => updateField('isPremium', e.target.checked)} />} label="Premium" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Content;
