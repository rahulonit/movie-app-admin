import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  InputAdornment,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../api/client';

interface Episode {
  _id?: string;
  episodeNumber: number;
  title: string;
  description: string;
  duration: number;
  cloudflareVideoId: string;
  thumbnail: string;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

interface SeriesData {
  _id: string;
  title: string;
  poster?: { vertical: string; horizontal: string };
  seasons?: Season[];
}

const ManageSeriesPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();

  const [series, setSeries] = useState<SeriesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seasonNumberInput, setSeasonNumberInput] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: 1,
    title: '',
    description: '',
    duration: 0,
    cloudflareVideoId: '',
    thumbnail: ''
  });

  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [fetchingDuration, setFetchingDuration] = useState(false);
  const [durationFetched, setDurationFetched] = useState(false);

  // Load series data
  useEffect(() => {
    loadSeries();
  }, [seriesId]);

  const loadSeries = async () => {
    if (!seriesId) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/series/${seriesId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = res.data.data;
      setSeries(data);
      if (data.seasons && data.seasons.length > 0) {
        setSelectedSeason(data.seasons[0].seasonNumber);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  // Fetch video duration from Cloudflare
  const fetchCloudflareVideoDuration = async (videoId: string) => {
    if (!videoId) return;
    setFetchingDuration(true);
    try {
      const res = await api.post('/admin/omdb/cloudflare-duration', { videoId });
      const duration = res.data.data?.duration || 0;
      setEpisodeForm((prev) => ({ ...prev, duration: Math.ceil(duration / 60) })); // Convert to minutes
      setDurationFetched(true);
    } catch (err: any) {
      console.error('Failed to fetch duration:', err);
      // Duration fetch failed, user can manually enter
    } finally {
      setFetchingDuration(false);
    }
  };

  // Fetch poster from Cloudinary or URL
  const fetchPosterImage = async (cloudinaryUrl: string) => {
    if (!cloudinaryUrl) return;
    try {
      // If it's a Cloudinary URL, extract the vertical poster
      if (cloudinaryUrl.includes('cloudinary')) {
        // Try to fetch the image to verify it exists
        const res = await fetch(cloudinaryUrl, { method: 'HEAD' });
        if (res.ok) {
          setEpisodeForm((prev) => ({ ...prev, thumbnail: cloudinaryUrl }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch poster:', err);
    }
  };

  // Handle Cloudflare Video ID change
  const handleCloudflareIdChange = (value: string) => {
    setEpisodeForm((prev) => ({ ...prev, cloudflareVideoId: value }));
    setDurationFetched(false);
    if (value) {
      fetchCloudflareVideoDuration(value);
    }
  };

  // Handle Poster URL change
  const handlePosterChange = (value: string) => {
    setEpisodeForm((prev) => ({ ...prev, thumbnail: value }));
    if (value && value.includes('cloudinary')) {
      fetchPosterImage(value);
    }
  };

  // Add new season
  const handleAddSeason = async () => {
    if (!series) return;
    try {
      if (!seasonNumberInput || seasonNumberInput < 1) {
        setError('Season number must be at least 1');
        return;
      }
      setLoading(true);
      await api.post(`/admin/series/${series._id}/seasons`, {
        seasonNumber: seasonNumberInput
      });
      setSeasonNumberInput(seasonNumberInput + 1);
      await loadSeries();
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add season');
    } finally {
      setLoading(false);
    }
  };

  // Add or update episode
  const handleSaveEpisode = async () => {
    if (!series) return;
    const missing: string[] = [];
    if (!episodeForm.title) missing.push('title');
    if (!episodeForm.description) missing.push('description');
    if (!episodeForm.duration) missing.push('duration');
    if (!episodeForm.cloudflareVideoId) missing.push('Cloudflare Video ID');
    if (!episodeForm.thumbnail) missing.push('thumbnail');

    if (missing.length) {
      setError(`Missing required: ${missing.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('[Episode Save] Mode:', editingEpisodeId ? 'UPDATE' : 'CREATE');
      console.log('[Episode Save] Data:', episodeForm);
      
      if (editingEpisodeId) {
        // Update existing episode
        const response = await api.put(
          `/admin/series/${series._id}/seasons/${selectedSeason}/episodes/${editingEpisodeId}`,
          episodeForm
        );
        console.log('[Episode Update] Success:', response.data);
      } else {
        // Create new episode
        const response = await api.post(
          `/admin/series/${series._id}/seasons/${selectedSeason}/episodes`,
          episodeForm
        );
        console.log('[Episode Create] Success:', response.data);
      }
      setEpisodeForm({
        episodeNumber: episodeForm.episodeNumber + 1,
        title: '',
        description: '',
        duration: 0,
        cloudflareVideoId: '',
        thumbnail: ''
      });
      setEditingEpisodeId(null);
      setDurationFetched(false);
      await loadSeries();
      setError('');
      setSuccess(editingEpisodeId ? 'Episode updated successfully' : 'Episode added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('[Episode Save] Error:', err.response?.data || err.message);
      setError(err?.response?.data?.message || err?.message || 'Failed to save episode');
    } finally {
      setLoading(false);
    }
  };

  // Edit episode
  const handleEditEpisode = (episode: Episode) => {
    setEditingEpisodeId(episode._id || null);
    setEpisodeForm({
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description,
      duration: episode.duration,
      cloudflareVideoId: episode.cloudflareVideoId,
      thumbnail: episode.thumbnail
    });
  };

  // Delete episode
  const handleDeleteEpisode = async (episodeId: string) => {
    if (!series || !confirm('Delete this episode?')) return;
    try {
      setLoading(true);
      await api.delete(
        `/admin/series/${series._id}/seasons/${selectedSeason}/episodes/${episodeId}`
      );
      await loadSeries();
      setEditingEpisodeId(null);
      setEpisodeForm({
        episodeNumber: 1,
        title: '',
        description: '',
        duration: 0,
        cloudflareVideoId: '',
        thumbnail: ''
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete episode');
    } finally {
      setLoading(false);
    }
  };

  const currentSeason = series?.seasons?.find((s) => s.seasonNumber === selectedSeason);
  const currentEpisodes = currentSeason?.episodes || [];

  if (loading && !series) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!series) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/series')}>
          Back to Series
        </Button>
        <Alert severity="error">{error || 'Series not found'}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton onClick={() => navigate('/series')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          Manage Seasons & Episodes: <strong>{series.title}</strong>
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {/* Add Season Section */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Add Season
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Season Number"
              type="number"
              value={seasonNumberInput}
              onChange={(e) => setSeasonNumberInput(Number(e.target.value))}
              size="small"
              sx={{ width: 160 }}
            />
            <Button
              variant="contained"
              onClick={handleAddSeason}
              disabled={loading}
            >
              Add Season
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Season Selector */}
      {(series.seasons?.length || 0) > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ alignSelf: 'center', fontWeight: 'bold' }}>
            Seasons:
          </Typography>
          {series.seasons?.map((season) => (
            <Chip
              key={season.seasonNumber}
              label={`Season ${season.seasonNumber}`}
              onClick={() => setSelectedSeason(season.seasonNumber)}
              color={selectedSeason === season.seasonNumber ? 'primary' : 'default'}
              variant={selectedSeason === season.seasonNumber ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      )}

      {/* Two Column Layout: Form (Left) + Episodes List (Right) */}
      <Grid container spacing={3}>
        {/* Left Column: Episode Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                {editingEpisodeId ? 'Edit Episode' : 'Add Episode'}
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Episode Number"
                    type="number"
                    value={episodeForm.episodeNumber}
                    onChange={(e) =>
                      setEpisodeForm((prev) => ({
                        ...prev,
                        episodeNumber: Number(e.target.value)
                      }))
                    }
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    value={episodeForm.duration}
                    onChange={(e) =>
                      setEpisodeForm((prev) => ({
                        ...prev,
                        duration: Number(e.target.value)
                      }))
                    }
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      endAdornment: durationFetched && (
                        <Tooltip title="Duration auto-fetched from Cloudflare">
                          <Box sx={{ color: '#4caf50', fontSize: '12px' }}>✓</Box>
                        </Tooltip>
                      )
                    }}
                  />
                </Stack>

                <TextField
                  label="Title"
                  value={episodeForm.title}
                  onChange={(e) =>
                    setEpisodeForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Description"
                  value={episodeForm.description}
                  onChange={(e) =>
                    setEpisodeForm((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Cloudflare Video ID"
                  value={episodeForm.cloudflareVideoId}
                  onChange={(e) => handleCloudflareIdChange(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Paste the Video ID from Cloudflare Stream (duration will auto-fetch)"
                  InputProps={{
                    endAdornment: fetchingDuration && (
                      <CircularProgress size={20} />
                    )
                  }}
                />

                <TextField
                  label="Thumbnail URL (Cloudinary)"
                  value={episodeForm.thumbnail}
                  onChange={(e) => handlePosterChange(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Paste Cloudinary vertical poster URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CloudUploadIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Thumbnail Preview */}
                {episodeForm.thumbnail && (
                  <Box
                    component="img"
                    src={episodeForm.thumbnail}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 1
                    }}
                    onError={(e) => {
                      console.error('Failed to load image:', episodeForm.thumbnail);
                    }}
                  />
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSaveEpisode}
                    disabled={loading}
                    fullWidth
                  >
                    {editingEpisodeId ? 'Update Episode' : 'Add Episode'}
                  </Button>
                  {editingEpisodeId && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditingEpisodeId(null);
                        setDurationFetched(false);
                        setError('');
                        setSuccess('');
                        setEpisodeForm({
                          episodeNumber: currentEpisodes.length + 1,
                          title: '',
                          description: '',
                          duration: 0,
                          cloudflareVideoId: '',
                          thumbnail: ''
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Episodes List */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Episodes - Season {selectedSeason}
              </Typography>

              {currentEpisodes.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>#</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentEpisodes
                        .slice()
                        .sort((a, b) => a.episodeNumber - b.episodeNumber)
                        .map((episode) => (
                          <TableRow
                            key={episode._id}
                            sx={{
                              backgroundColor:
                                editingEpisodeId === episode._id ? '#e3f2fd' : 'inherit',
                              '&:hover': { backgroundColor: '#f5f5f5' }
                            }}
                          >
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {episode.episodeNumber}
                            </TableCell>
                            <TableCell>
                              <Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {episode.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ maxWidth: 150 }}
                                >
                                  {episode.description?.substring(0, 40)}...
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{episode.duration} min</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditEpisode(episode)}
                                  color={editingEpisodeId === episode._id ? 'primary' : 'default'}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteEpisode(episode._id || '')}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No episodes yet. Add one using the form on the left.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ManageSeriesPage;
