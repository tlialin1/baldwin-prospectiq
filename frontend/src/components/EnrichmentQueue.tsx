import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface EnrichmentQueueItem {
  id: string;
  name: string;
  opportunity_score: number | null;
  enrichment_confidence: number | null;
  status: string;
  enrichment_attempts: number;
  last_enrichment_at: string | null;
}

interface EnrichmentStats {
  overall: {
    total_prospects: number;
    enriched_count: number;
    pending_count: number;
    avg_confidence: number | null;
    max_confidence: number | null;
    min_confidence: number | null;
  };
  api_breakdown: Array<{
    enrichment_source: string;
    total_calls: number;
    avg_confidence: number | null;
    success_count: number;
    failed_count: number;
  }>;
}

interface APIQuota {
  [key: string]: {
    daily_limit: number;
    used_today: number;
    remaining: number;
    reset_at: string;
  };
}

const EnrichmentQueue: React.FC = () => {
  const [queueItems, setQueueItems] = useState<EnrichmentQueueItem[]>([]);
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [quota, setQuota] = useState<APIQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EnrichmentQueueItem | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch enrichment queue
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [queueResponse, statsResponse, quotaResponse] = await Promise.all([
        fetch('/api/leads/enrichment/queue?limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/leads/enrichment/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/leads/enrichment/quota', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      const queueData = await queueResponse.json();
      const statsData = await statsResponse.json();
      const quotaData = await quotaResponse.json();

      setQueueItems(queueData);
      setStats(statsData);
      setQuota(quotaData);
    } catch (err) {
      console.error('Failed to fetch enrichment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Handle retry enrichment
  const handleRetryEnrichment = async (itemId: string) => {
    setProcessing(itemId);
    try {
      const response = await fetch(`/api/leads/enrichment/${itemId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ force: true })
      });

      if (!response.ok) throw new Error('Retry failed');

      // Re-fetch queue after delay
      setTimeout(() => {
        fetchQueue();
        setProcessing(null);
      }, 2000);
    } catch (err) {
      console.error('Retry failed:', err);
      setProcessing(null);
    }
  };

  // Get status chip configuration
  const getStatusConfig = (status: string, confidence: number | null) => {
    if (status === 'pending' && confidence === null) {
      return { label: 'Pending Enrichment', color: 'warning', icon: <PauseIcon /> };
    }
    if (confidence === null) {
      return { label: 'Failed', color: 'error', icon: <ErrorIcon /> };
    }
    if (confidence >= 0.8) {
      return { label: 'High Confidence', color: 'success', icon: <CheckIcon /> };
    }
    if (confidence >= 0.6) {
      return { label: 'Medium Confidence', color: 'info', icon: <WarningIcon /> };
    }
    return { label: 'Low Confidence', color: 'default', icon: <WarningIcon /> };
  };

  // Get score color
  const getScoreColor = (score: number | null): string => {
    if (score === null) return '#888888';
    if (score >= 75) return '#ff4444';
    if (score >= 50) return '#ff8800';
    if (score >= 25) return '#4488ff';
    return '#888888';
  };

  // Calculate quota percentage
  const getQuotaPercentage = (used: number, limit: number): number => {
    return Math.round((used / limit) * 100);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enrichment Queue
      </Typography>

      {/* Action Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchQueue}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            disabled={loading}
          >
            Process All Pending
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {queueItems.length} items in queue
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Prospects
                </Typography>
                <Typography variant="h3">
                  {stats.overall.total_prospects}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`${stats.overall.enriched_count} enriched`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`${stats.overall.pending_count} pending`}
                    size="small"
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Average Confidence
                </Typography>
                <Typography variant="h3">
                  {stats.overall.avg_confidence ? Math.round(stats.overall.avg_confidence * 100) : 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.overall.avg_confidence ? stats.overall.avg_confidence * 100 : 0}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Enrichment Rate
                </Typography>
                <Typography variant="h3">
                  {stats.overall.total_prospects > 0
                    ? Math.round((stats.overall.enriched_count / stats.overall.total_prospects) * 100)
                    : 0}%
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`${stats.overall.min_confidence ? Math.round(stats.overall.min_confidence * 100) : 0}% min`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${stats.overall.max_confidence ? Math.round(stats.overall.max_confidence * 100) : 0}% max`}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  API Calls Today
                </Typography>
                <Typography variant="h3">
                  {stats.api_breakdown.reduce((sum, api) => sum + api.total_calls, 0)}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`${stats.api_breakdown.length} APIs`}
                    size="small"
                    color="info"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* API Quota Monitor */}
      {quota && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon /> API Quota Usage
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(quota).map(([api, data]) => (
              <Grid item xs={12} md={4} key={api}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {api.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.used_today} / {data.daily_limit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getQuotaPercentage(data.used_today, data.daily_limit)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Resets: {new Date(data.reset_at).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Queue Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Last Enriched</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : queueItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography>No items in enrichment queue</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                queueItems.map((item) => {
                  const statusConfig = getStatusConfig(item.status, item.enrichment_confidence);
                  const daysSinceEnriched = item.last_enrichment_at
                    ? Math.floor((Date.now() - new Date(item.last_enrichment_at).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {item.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="h6"
                            sx={{ color: getScoreColor(item.opportunity_score) }}
                          >
                            {item.opportunity_score ?? 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.enrichment_confidence !== null ? (
                          <Box>
                            <Typography variant="body2">
                              {Math.round(item.enrichment_confidence * 100)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={item.enrichment_confidence * 100}
                              sx={{ width: 60, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not enriched
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          size="small"
                          color={statusConfig.color as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.enrichment_attempts} attempts
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.last_enrichment_at ? (
                          <Typography variant="body2">
                            {daysSinceEnriched === 0
                              ? 'Today'
                              : daysSinceEnriched === 1
                              ? 'Yesterday'
                              : `${daysSinceEnriched} days ago`}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Never
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.enrichment_confidence === null && (
                          <Tooltip title="Retry Enrichment">
                            <IconButton
                              size="small"
                              onClick={() => handleRetryEnrichment(item.id)}
                              disabled={processing === item.id}
                            >
                              {processing === item.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <RefreshIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedItem(item)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Item Details Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="md"
      >
        <DialogTitle>
          Enrichment Details: {selectedItem?.name}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>ID:</strong> {selectedItem.id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedItem.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedItem.status}
                  </Typography>
                </Grid>

                {selectedItem.opportunity_score !== null && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Lead Score
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h2" sx={{ color: getScoreColor(selectedItem.opportunity_score) }}>
                        {selectedItem.opportunity_score}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Opportunity Score
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {selectedItem.enrichment_confidence !== null && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Enrichment Confidence
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h3" color="primary">
                        {Math.round(selectedItem.enrichment_confidence * 100)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedItem.enrichment_confidence * 100}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Enrichment Stats
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Enrichment Attempts"
                        secondary={`${selectedItem.enrichment_attempts} attempts`}
                      />
                    </ListItem>
                    {selectedItem.last_enrichment_at && (
                      <ListItem>
                        <ListItemText
                          primary="Last Enriched"
                          secondary={new Date(selectedItem.last_enrichment_at).toLocaleString()}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnrichmentQueue;
