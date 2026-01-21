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
  const [rows, setRows] = useState<SeriesRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [manageOpen, setManageOpen] = useState(false);
  const [form, setForm] = useState<SeriesPayload>(emptySeries());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesRow | null>(null);
  const [seasonNumberInput, setSeasonNumberInput] = useState<number>(1);
  const [episodeForm, setEpisodeForm] = useState({
    seasonNumber: '' as any,
    episodeNumber: 1,
    title: '',
    description: '',
    duration: 0,
    muxPlaybackId: '',
    muxAssetId: '',
    thumbnail: ''
  });
  const dialogTitle = useMemo(() => (editingId ? 'Edit Series' : 'Create Series'), [editingId]);

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

  useEffect(() => { load(); }, []);

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
    setSelectedSeries(row);
    setManageOpen(true);
    setSeasonNumberInput((row.seasons?.length || 0) + 1);
    setEpisodeForm((prev) => ({ ...prev, seasonNumber: row.seasons?.[0]?.seasonNumber || '' }));
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

  const refreshSelectedSeries = async (seriesId: string) => {
    const fetched = await load();
    const updated = fetched.find((r) => r._id === seriesId);
    if (updated) setSelectedSeries(updated);
  };

  const handleAddSeason = async () => {
    if (!selectedSeries) return;
    try {
      if (!seasonNumberInput || seasonNumberInput < 1) {
        setError('Season number must be at least 1');
        return;
      }
      await api.post(`/admin/series/${selectedSeries._id}/seasons`, { seasonNumber: seasonNumberInput });
      setSeasonNumberInput(seasonNumberInput + 1);
      await refreshSelectedSeries(selectedSeries._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Add season failed');
    }
  };

  const handleAddEpisode = async () => {
    if (!selectedSeries) return;
    const missing: string[] = [];
    if (!episodeForm.seasonNumber) missing.push('season');
    if (!episodeForm.title) missing.push('title');
    if (!episodeForm.description) missing.push('description');
    if (!episodeForm.duration) missing.push('duration');
    if (!episodeForm.muxPlaybackId || !episodeForm.muxAssetId) missing.push('Mux IDs');
    if (!episodeForm.thumbnail) missing.push('thumbnail');
    if (missing.length) {
      setError(`Missing required: ${missing.join(', ')}`);
      return;
    }
    try {
      await api.post(`/admin/series/${selectedSeries._id}/seasons/${episodeForm.seasonNumber}/episodes`, {
        episodeNumber: episodeForm.episodeNumber,
        title: episodeForm.title,
        description: episodeForm.description,
        duration: episodeForm.duration,
        muxPlaybackId: episodeForm.muxPlaybackId,
        muxAssetId: episodeForm.muxAssetId,
        thumbnail: episodeForm.thumbnail
      });
      setEpisodeForm({
        seasonNumber: episodeForm.seasonNumber,
        episodeNumber: episodeForm.episodeNumber + 1,
        title: '',
        description: '',
        duration: 0,
        muxPlaybackId: '',
        muxAssetId: '',
        thumbnail: ''
      });
      await refreshSelectedSeries(selectedSeries._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Add episode failed');
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
            <TextField select label="Maturity Rating" value={form.maturityRating} onChange={(e) => updateField('maturityRating', e.target.value as any)} error={!!fieldErrors.maturityRating} helperText={fieldErrors.maturityRating}>
              {MATURITY_RATINGS.map((rate) => (
                <MenuItem key={rate} value={rate}>{rate}</MenuItem>
              ))}
            </TextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
            <TextField label="Poster Vertical URL" value={form.poster.vertical} onChange={(e) => updateField('poster', { ...form.poster, vertical: e.target.value })} error={!!fieldErrors.posterVertical} helperText={fieldErrors.posterVertical} />
            <TextField label="Poster Horizontal URL" value={form.poster.horizontal} onChange={(e) => updateField('poster', { ...form.poster, horizontal: e.target.value })} error={!!fieldErrors.posterHorizontal} helperText={fieldErrors.posterHorizontal} />
          </Box>
          <FormControlLabel control={<Switch checked={form.isPremium} onChange={(e) => updateField('isPremium', e.target.checked)} />} label="Premium" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Manage Seasons & Episodes {selectedSeries ? `- ${selectedSeries.title}` : ''}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Add Season</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Season Number"
                  type="number"
                  value={seasonNumberInput}
                  onChange={(e) => setSeasonNumberInput(Number(e.target.value))}
                  sx={{ width: 160 }}
                />
                <Button variant="contained" onClick={handleAddSeason} disabled={!selectedSeries}>Add Season</Button>
              </Stack>
              {selectedSeries?.seasons?.length ? (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {selectedSeries.seasons
                    .slice()
                    .sort((a, b) => a.seasonNumber - b.seasonNumber)
                    .map((season) => (
                      <Paper key={season.seasonNumber} sx={{ p: 1 }}>
                        <Typography variant="subtitle2">Season {season.seasonNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">Episodes: {season.episodes?.length || 0}</Typography>
                      </Paper>
                    ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No seasons yet.</Typography>
              )}
            </Paper>

            <Paper sx={{ p: 2, flex: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Add Episode</Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Season"
                  value={episodeForm.seasonNumber}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, seasonNumber: e.target.value }))}
                >
                  {(selectedSeries?.seasons || []).map((s) => (
                    <MenuItem key={s.seasonNumber} value={s.seasonNumber}>Season {s.seasonNumber}</MenuItem>
                  ))}
                </TextField>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Episode Number"
                    type="number"
                    value={episodeForm.episodeNumber}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, episodeNumber: Number(e.target.value) }))}
                  />
                  <TextField
                    label="Duration (min)"
                    type="number"
                    value={episodeForm.duration}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                  />
                </Stack>
                <TextField
                  label="Title"
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <TextField
                  label="Description"
                  multiline
                  minRows={2}
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Mux Playback ID"
                    value={episodeForm.muxPlaybackId}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, muxPlaybackId: e.target.value }))}
                  />
                  <TextField
                    label="Mux Asset ID"
                    value={episodeForm.muxAssetId}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, muxAssetId: e.target.value }))}
                  />
                </Stack>
                <TextField
                  label="Thumbnail URL"
                  value={episodeForm.thumbnail}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                />
                <Button variant="contained" onClick={handleAddEpisode} disabled={!selectedSeries || !(selectedSeries.seasons?.length)}>
                  Add Episode
                </Button>
              </Stack>
            </Paper>
          </Stack>

          {selectedSeries?.seasons?.length ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Seasons & Episodes</Typography>
              <Stack spacing={2}>
                {selectedSeries.seasons
                  .slice()
                  .sort((a, b) => a.seasonNumber - b.seasonNumber)
                  .map((season) => (
                    <Box key={season.seasonNumber} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                      <Typography variant="subtitle2">Season {season.seasonNumber}</Typography>
                      {season.episodes?.length ? (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Title</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Mux Playback</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {season.episodes.map((ep: any) => (
                              <TableRow key={ep._id || `${season.seasonNumber}-${ep.episodeNumber}`}>
                                <TableCell>{ep.episodeNumber}</TableCell>
                                <TableCell>{ep.title}</TableCell>
                                <TableCell>{ep.duration} min</TableCell>
                                <TableCell>{ep.muxPlaybackId}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No episodes yet.</Typography>
                      )}
                    </Box>
                  ))}
              </Stack>
            </Paper>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Series;
