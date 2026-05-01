import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Avatar,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  EventNote as EventNoteIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Recommend as RecommendIcon
} from '@mui/icons-material';

interface Prospect {
  id: string;
  prospect_data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    age?: number;
    occupation?: string;
    current_carrier?: string;
    current_premium?: number;
  };
  enrichment_data?: {
    demographics?: any;
    property?: any;
    insurance?: any;
    life_events?: any;
    social?: any;
    behavioral?: any;
    confidence?: number;
    enriched_at?: string;
  };
  opportunity_score: number;
  enrichment_confidence: number;
  status: string;
  created_at: string;
  assigned_agent_name?: string;
  enrichment_history?: any[];
  trigger_history?: any[];
}

interface ScoreBreakdown {
  score: number;
  tier: string;
  color: string;
  factors: {
    positive: Array<{
      category: string;
      label: string;
      points: number;
    }>;
    missing: string[];
  };
  recommendations: string[];
}

interface ProspectDetailProps {
  prospectId: string;
  onClose?: () => void;
}

const ProspectDetail: React.FC<ProspectDetailProps> = ({ prospectId, onClose }) => {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Fetch prospect details
  const fetchProspect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${prospectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prospect details');
      }

      const data = await response.json();
      setProspect(data);

      // Calculate score breakdown
      if (data.opportunity_score !== null) {
        try {
          const breakdownResponse = await fetch(`/api/leads/${prospectId}/score-breakdown`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (breakdownResponse.ok) {
            const breakdownData = await breakdownResponse.json();
            setScoreBreakdown(breakdownData);
          }
        } catch (err) {
          console.error('Failed to fetch score breakdown:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspect();
  }, [prospectId]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 75) return '#ff4444'; // Hot - Red
    if (score >= 50) return '#ff8800'; // Warm - Orange
    if (score >= 25) return '#4488ff'; // Cool - Blue
    return '#888888'; // Cold - Gray
  };

  // Generate initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle manual re-enrichment
  const handleReEnrich = async () => {
    setEnriching(true);
    try {
      const response = await fetch(`/api/leads/enrichment/${prospectId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ force: true })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger re-enrichment');
      }

      // Wait a bit and refresh
      setTimeout(() => {
        fetchProspect();
        setEnriching(false);
      }, 2000);
    } catch (err) {
      setError('Failed to trigger re-enrichment');
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!prospect) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Prospect not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            bgcolor: getScoreColor(prospect.opportunity_score || 0),
            width: 56,
            height: 56
          }}
        >
          <Typography variant="h5">
            {getInitials(prospect.prospect_data.name)}
          </Typography>
        </Avatar>
        <Box>
          <Typography variant="h4">
            {prospect.prospect_data.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            ID: {prospect.id}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', textAlign: 'center' }}>
          <Typography variant="h3" sx={{ color: getScoreColor(prospect.opportunity_score || 0) }}>
            {prospect.opportunity_score || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Opportunity Score
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon /> Prospect Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><EmailIcon color="action" /></ListItemIcon>
                  <ListItemText
                    primary={prospect.prospect_data.email}
                    secondary="Email"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
                  <ListItemText
                    primary={prospect.prospect_data.phone}
                    secondary="Phone"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><HomeIcon color="action" /></ListItemIcon>
                  <ListItemText
                    primary={prospect.prospect_data.address}
                    secondary="Address"
                  />
                </ListItem>
                {prospect.prospect_data.age && (
                  <ListItem>
                    <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
                    <ListItemText
                      primary={`${prospect.prospect_data.age} years old`}
                      secondary="Age"
                    />
                  </ListItem>
                )}
                {prospect.prospect_data.occupation && (
                  <ListItem>
                    <ListItemIcon><BusinessIcon color="action" /></ListItemIcon>
                    <ListItemText
                      primary={prospect.prospect_data.occupation}
                      secondary="Occupation"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Score Breakdown Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> Score Breakdown
              </Typography>

              {scoreBreakdown ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Overall Score</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {scoreBreakdown.score}/100 ({scoreBreakdown.tier})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={scoreBreakdown.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(scoreBreakdown.score),
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Positive Factors ({scoreBreakdown.factors.positive.length}):
                  </Typography>
                  <List dense>
                    {scoreBreakdown.factors.positive.map((factor, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={factor.label}
                          secondary={`+${factor.points} points`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {scoreBreakdown.factors.missing.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Missing Opportunities:
                      </Typography>
                      <List dense>
                        {scoreBreakdown.factors.missing.map((factor, idx) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <WarningIcon color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={factor} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No score breakdown available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Enrichment Data */}
        {prospect.enrichment_data && (
          <>
            {/* Demographics */}
            {prospect.enrichment_data.demographics && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Demographics
                    </Typography>
                    <List dense>
                      {prospect.enrichment_data.demographics.age && (
                        <ListItem>
                          <ListItemText
                            primary={`${prospect.enrichment_data.demographics.age} years old`}
                            secondary="Age"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.demographics.household_income && (
                        <ListItem>
                          <ListItemText
                            primary={formatCurrency(prospect.enrichment_data.demographics.household_income)}
                            secondary="Household Income"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.demographics.household_size && (
                        <ListItem>
                          <ListItemText
                            primary={`${prospect.enrichment_data.demographics.household_size} people`}
                            secondary="Household Size"
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Property Data */}
            {prospect.enrichment_data.property && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Property
                    </Typography>
                    <List dense>
                      {prospect.enrichment_data.property.estimated_value && (
                        <ListItem>
                          <ListItemText
                            primary={formatCurrency(prospect.enrichment_data.property.estimated_value)}
                            secondary="Estimated Value"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.property.home_type && (
                        <ListItem>
                          <ListItemText
                            primary={prospect.enrichment_data.property.home_type}
                            secondary="Home Type"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.property.square_footage && (
                        <ListItem>
                          <ListItemText
                            primary={`${prospect.enrichment_data.property.square_footage.toLocaleString()} sq ft`}
                            secondary="Square Footage"
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Insurance */}
            {prospect.enrichment_data.insurance && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Insurance
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={prospect.enrichment_data.insurance.current_carrier || 'Unknown'}
                          secondary="Current Carrier"
                        />
                      </ListItem>
                      {prospect.enrichment_data.insurance.current_premium && (
                        <ListItem>
                          <ListItemText
                            primary={formatCurrency(prospect.enrichment_data.insurance.current_premium)}
                            secondary="Current Premium"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.insurance.has_life_insurance !== undefined && (
                        <ListItem>
                          <ListItemText
                            primary={prospect.enrichment_data.insurance.has_life_insurance ? 'Yes' : 'No'}
                            secondary="Has Life Insurance"
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Life Events Timeline */}
            {prospect.enrichment_data.life_events && Object.keys(prospect.enrichment_data.life_events).length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventNoteIcon /> Life Events
                    </Typography>
                    <List>
                      {prospect.enrichment_data.life_events.recently_married && (
                        <ListItem>
                          <ListItemIcon>💍</ListItemIcon>
                          <ListItemText
                            primary="Recently Married"
                            secondary="Detected in enrichment data (+15 points)"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.life_events.new_baby && (
                        <ListItem>
                          <ListItemIcon>👶</ListItemIcon>
                          <ListItemText
                            primary="New Baby/Child"
                            secondary="Detected in household data (+15 points)"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.life_events.home_purchase_last_18_months && (
                        <ListItem>
                          <ListItemIcon>🏠</ListItemIcon>
                          <ListItemText
                            primary="Recent Home Purchase"
                            secondary="Purchased within last 18 months (+10 points)"
                          />
                        </ListItem>
                      )}
                      {prospect.enrichment_data.life_events.approaching_retirement && (
                        <ListItem>
                          <ListItemIcon>🎓</ListItemIcon>
                          <ListItemText
                            primary="Approaching Retirement"
                            secondary="Age 62-67, planning stage (+8 points)"
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Confidence Score */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Enrichment Quality
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" color="primary">
                      {Math.round((prospect.enrichment_data.confidence || 0) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confidence Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(prospect.enrichment_data.confidence || 0) * 100}
                      sx={{ mt: 2, height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Enriched: {new Date(prospect.enrichment_data.enriched_at || '').toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Recommendations */}
        {scoreBreakdown && scoreBreakdown.recommendations.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecommendIcon /> Recommended Actions
                </Typography>
                <List>
                  {scoreBreakdown.recommendations.map((rec, idx) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <AssignmentIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleReEnrich}
          disabled={enriching}
          startIcon={enriching ? <CircularProgress size={20} /> : null}
        >
          {enriching ? 'Re-enriching...' : 'Re-Enrich Data'}
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default ProspectDetail;
