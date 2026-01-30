import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
  Typography,
  InputAdornment,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api/client';

interface SeriesRow {
  _id: string;
  title: string;
  isPremium: boolean;
  isPublished: boolean;
  releaseYear?: number;
  language?: string;
  seasons?: Array<{ seasonNumber: number; episodes: any[] }>;
}

type SeriesPayload = {
  title: string;
  description: string;
  genres: string[];
  language: string;
  releaseYear: number;
  poster: { vertical: string; horizontal: string };
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
  'Hindi',
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

const emptySeries = (): SeriesPayload => ({
  title: '',
  description: '',
  genres: [],
  language: '',
  releaseYear: new Date().getFullYear(),
  poster: { vertical: '', horizontal: '' },
  maturityRating: 'U',
  isPremium: false
});

const Series: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SeriesRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<SeriesPayload>(emptySeries());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [omdbSearchQuery, setOmdbSearchQuery] = useState('');
  const [omdbSearchResults, setOmdbSearchResults] = useState<any[]>([]);
  const [omdbLoading, setOmdbLoading] = useState(false);
  const [omdbError, setOmdbError] = useState('');
  const [showOmdbResults, setShowOmdbResults] = useState(false);
  const dialogTitle = useMemo(() => (editingId ? 'Edit Series' : 'Create Series from OMDB'), [editingId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/series?limit=50', { headers: { 'Cache-Control': 'no-cache' } });
      const fetched = res.data.data.series || [];
      setRows(fetched);
      return fetched as SeriesRow[];
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load series');
      return [] as SeriesRow[];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Search OMDB for series
  const handleOmdbSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setOmdbSearchResults([]);
      setOmdbError('');
      return;
    }

    setOmdbLoading(true);
    setOmdbError('');
    try {
      const res = await api.get(`/admin/omdb/search`, {
        params: { query, type: 'series' }
      });
      const results = res.data.data?.results || [];
      setOmdbSearchResults(results);
      if (results.length === 0) {
        setOmdbError('No series found. Try a different title.');
      }
    } catch (err: any) {
      setOmdbError(err?.response?.data?.message || 'Search failed. Please try again.');
      setOmdbSearchResults([]);
    } finally {
      setOmdbLoading(false);
    }
  };

  // Fill form with OMDB data
  const handleSelectOmdbSeries = async (omdbId: string) => {
    setOmdbLoading(true);
    setOmdbError('');
    try {
      const res = await api.get(`/admin/omdb/series/${omdbId}`);
      const data = res.data.data;
      
      setForm({
        title: data.title || '',
        description: data.plot || data.description || '',
        genres: data.genres?.slice(0, 5) || [],
        language: data.language || data.languages?.[0] || 'English',
        releaseYear: data.startYear || new Date().getFullYear(),
        poster: {
          vertical: data.posters?.vertical || data.poster || '',
          horizontal: data.posters?.horizontal || data.poster || ''
        },
        maturityRating: (data.contentRating || 'U').toUpperCase() as any,
        isPremium: false
      });

      setShowOmdbResults(false);
      setOmdbSearchQuery('');
      setOmdbSearchResults([]);
      setFieldErrors({});
    } catch (err: any) {
      setOmdbError(err?.response?.data?.message || 'Failed to fetch series details');
    } finally {
      setOmdbLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySeries());
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingId(row._id);
    setForm({
      title: row.title || '',
      description: row.description || '',
      genres: row.genres || [],
      language: row.language || '',
      releaseYear: row.releaseYear || new Date().getFullYear(),
      poster: row.poster || { vertical: '', horizontal: '' },
      maturityRating: row.maturityRating || 'U',
      isPremium: row.isPremium || false
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openManage = (row: SeriesRow) => {
    navigate(`/series/${row._id}/manage`);
  };

  const updateField = (key: keyof SeriesPayload, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      if (!form.poster.vertical || !form.poster.horizontal) missing.push('poster URLs');
      if (!['U', 'UA', 'A'].includes(form.maturityRating)) missing.push('maturity rating');

      if (!form.title) nextFieldErrors.title = 'Title is required';
      if (!form.description) nextFieldErrors.description = 'Description is required';
      if (!form.genres.length) nextFieldErrors.genres = 'Select at least one genre';
      if (!form.language) nextFieldErrors.language = 'Language is required';
      if (!form.releaseYear) nextFieldErrors.releaseYear = 'Release year is required';
      if (!form.poster.vertical) nextFieldErrors.posterVertical = 'Vertical poster URL required';
      if (!form.poster.horizontal) nextFieldErrors.posterHorizontal = 'Horizontal poster URL required';
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

      const payload = { ...form, genres: sanitizedGenres, language: form.language };
      if (editingId) {
        await api.put(`/admin/series/${editingId}`, payload);
      } else {
        await api.post('/admin/series', payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this series?')) return;
    try {
      await api.delete(`/admin/series/${id}`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Series</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</Button>
          <Button variant="contained" onClick={openCreate}>Add Series</Button>
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
                    <Button size="small" onClick={() => openManage(row)}>Manage</Button>
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
          {/* OMDB Search Section */}
          {!editingId && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                🔍 Search Series from OMDB
              </Typography>
              <Stack spacing={2}>
                <TextField
                  placeholder="Enter series name..."
                  value={omdbSearchQuery}
                  onChange={(e) => {
                    setOmdbSearchQuery(e.target.value);
                    handleOmdbSearch(e.target.value);
                  }}
                  onFocus={() => setShowOmdbResults(true)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {omdbLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                      </InputAdornment>
                    ),
                  }}
                  error={!!omdbError}
                  helperText={omdbError}
                />

                {/* OMDB Search Results */}
                {showOmdbResults && omdbSearchResults.length > 0 && (
                  <Box sx={{ 
                    maxHeight: 300, 
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    backgroundColor: '#fff'
                  }}>
                    {omdbSearchResults.map((result: any) => (
                      <Paper
                        key={result.id}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          cursor: 'pointer',
                          backgroundColor: '#fff',
                          '&:hover': { backgroundColor: '#f9f9f9' },
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center'
                        }}
                        onClick={() => handleSelectOmdbSeries(result.id)}
                      >
                        {result.poster && (
                          <Box
                            component="img"
                            src={result.poster}
                            sx={{ width: 50, height: 75, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {result.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.startYear} {result.endYear ? `- ${result.endYear}` : ''}
                          </Typography>
                          {result.description && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {result.description.substring(0, 100)}...
                            </Typography>
                          )}
                        </Box>
                        <Button variant="outlined" size="small">Select</Button>
                      </Paper>
                    ))}
                  </Box>
                )}

                {omdbSearchQuery && !omdbLoading && omdbSearchResults.length === 0 && !omdbError && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Enter a series name to search
                  </Typography>
                )}
              </Stack>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                ℹ️ Select a series to auto-fill all details from OMDB
              </Typography>
            </Box>
          )}

          {/* Form Fields - Auto-filled from OMDB */}
          <TextField 
            label="Title" 
            value={form.title} 
            onChange={(e) => updateField('title', e.target.value)} 
            required 
            fullWidth 
            error={!!fieldErrors.title} 
            helperText={fieldErrors.title}
            disabled={omdbLoading}
          />
          
          <TextField 
            label="Description" 
            value={form.description} 
            onChange={(e) => updateField('description', e.target.value)} 
            multiline 
            minRows={2} 
            fullWidth 
            error={!!fieldErrors.description} 
            helperText={fieldErrors.description}
            disabled={omdbLoading}
          />
          
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
                disabled={omdbLoading}
              />
            )}
          />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2 }}>
            <TextField 
              select 
              label="Language" 
              value={form.language} 
              onChange={(e) => updateField('language', e.target.value)} 
              error={!!fieldErrors.language} 
              helperText={fieldErrors.language}
              disabled={omdbLoading}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </TextField>
            
            <TextField 
              label="Release Year" 
              type="number" 
              value={form.releaseYear} 
              onChange={(e) => updateField('releaseYear', Number(e.target.value))} 
              error={!!fieldErrors.releaseYear} 
              helperText={fieldErrors.releaseYear}
              disabled={omdbLoading}
            />
            
            <TextField 
              select 
              label="Maturity Rating" 
              value={form.maturityRating} 
              onChange={(e) => updateField('maturityRating', e.target.value as any)} 
              error={!!fieldErrors.maturityRating} 
              helperText={fieldErrors.maturityRating}
              disabled={omdbLoading}
            >
              {MATURITY_RATINGS.map((rate) => (
                <MenuItem key={rate} value={rate}>{rate}</MenuItem>
              ))}
            </TextField>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
            <TextField 
              label="Poster Vertical URL" 
              value={form.poster.vertical} 
              onChange={(e) => updateField('poster', { ...form.poster, vertical: e.target.value })} 
              error={!!fieldErrors.posterVertical} 
              helperText={fieldErrors.posterVertical}
              disabled={omdbLoading}
            />
            
            <TextField 
              label="Poster Horizontal URL" 
              value={form.poster.horizontal} 
              onChange={(e) => updateField('poster', { ...form.poster, horizontal: e.target.value })} 
              error={!!fieldErrors.posterHorizontal} 
              helperText={fieldErrors.posterHorizontal}
              disabled={omdbLoading}
            />
          </Box>
          
          <FormControlLabel 
            control={<Switch checked={form.isPremium} onChange={(e) => updateField('isPremium', e.target.checked)} disabled={omdbLoading} />} 
            label="Premium" 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={omdbLoading}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Series;
