import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, LinearProgress, Chip,
  Card, CardContent, CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon
} from '@mui/icons-material';

interface AgentMetrics {
  book_relevance_score: number;
  agent_effectiveness_score: number;
  total_policies: number;
  total_clients: number;
  monthly_premium: number;
  ytd_commission: number;
  promotion_progress: number;
  current_rank: string;
  next_rank: string;
}

const AgentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMetrics({
        book_relevance_score: 78,
        agent_effectiveness_score: 85,
        total_policies: 147,
        total_clients: 89,
        monthly_premium: 28450,
        ytd_commission: 45600,
        promotion_progress: 65,
        current_rank: 'Senior Agent',
        next_rank: 'Team Leader'
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!metrics) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Book Relevance Score */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Book Relevance Score</Typography>
              </Box>
              <Typography variant="h2" color={getScoreColor(metrics.book_relevance_score)}>
                {metrics.book_relevance_score}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.book_relevance_score}
                color={getScoreColor(metrics.book_relevance_score)}
                sx={{ mt: 2, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Measures the strength and durability of your book of business
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Effectiveness Score */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StarIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Agent Effectiveness Score</Typography>
              </Box>
              <Typography variant="h2" color={getScoreColor(metrics.agent_effectiveness_score)}>
                {metrics.agent_effectiveness_score}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.agent_effectiveness_score}
                color={getScoreColor(metrics.agent_effectiveness_score)}
                sx={{ mt: 2, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Measures your professional engagement and operational discipline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Total Policies</Typography>
              </Box>
              <Typography variant="h4">{metrics.total_policies}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Total Clients</Typography>
              </Box>
              <Typography variant="h4">{metrics.total_clients}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Premium
              </Typography>
              <Typography variant="h4">
                ${metrics.monthly_premium.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                YTD Commission
              </Typography>
              <Typography variant="h4">
                ${metrics.ytd_commission.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Promotion Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Promotion Progress
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Chip label={metrics.current_rank} color="primary" sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1, mx: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.promotion_progress}
                    sx={{ height: 15, borderRadius: 7 }}
                  />
                </Box>
                <Chip label={metrics.next_rank} color="secondary" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {metrics.promotion_progress}% complete toward {metrics.next_rank}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentDashboard;
