import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Pagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  View as ViewIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

interface Prospect {
  id: string;
  prospect_data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    state?: string;
    current_carrier?: string;
  };
  enrichment_data?: any;
  opportunity_score: number;
  enrichment_confidence: number;
  status: string;
  created_at: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  life_events?: any;
}

interface LeadListProps {
  agentId?: string;
  onSelectProspect?: (prospect: Prospect) => void;
}

const LeadList: React.FC<LeadListProps> = ({ agentId, onSelectProspect }) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    minScore: '',
    maxScore: '',
    status: '',
    state: '',
    assignedTo: agentId || ''
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch prospects
  const fetchProspects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });

      const response = await fetch(`/api/leads?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prospects');
      }

      const data = await response.json();
      setProspects(data.prospects);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [page, filters, agentId]);

  // Get score color
  const getScoreColor = (score: number): 'hot' | 'warm' | 'cool' | 'cold' => {
    if (score >= 75) return 'hot';
    if (score >= 50) return 'warm';
    if (score >= 25) return 'cool';
    return 'cold';
  };

  const getScoreChipColor = (score: number): 'error' | 'warning' | 'info' | 'default' => {
    if (score >= 75) return 'error';
    if (score >= 50) return 'warning';
    if (score >= 25) return 'info';
    return 'default';
  };

  const getStatusColor = (status: string): any => {
    const colors: Record<string, any> = {
      'pending': 'default',
      'assigned': 'primary',
      'priority': 'error',
      'contacted': 'warning',
      'converted': 'success',
      'nurture': 'info',
      'review_needed': 'secondary'
    };
    return colors[status] || 'default';
  };

  // Handle selection
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(prospects.map(p => p.id));
      setSelectedProspects(newSelected);
    } else {
      setSelectedProspects(new Set());
    }
  };

  const handleSelectOne = (event: React.ChangeEvent<HTMLInputElement>, prospectId: string) => {
    const newSelected = new Set(selectedProspects);
    if (event.target.checked) {
      newSelected.add(prospectId);
    } else {
      newSelected.delete(prospectId);
    }
    setSelectedProspects(newSelected);
  };

  // Bulk actions
  const handleBulkAssign = async () => {
    if (selectedProspects.size === 0) return;

    try {
      const response = await fetch('/api/leads/bulk/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prospect_ids: Array.from(selectedProspects),
          agent_id: agentId
        })
      });

      if (!response.ok) throw new Error('Failed to assign leads');

      setSelectedProspects(new Set());
      fetchProspects();
    } catch (err) {
      setError('Failed to assign selected leads');
    }
  };

  const handleExport = () => {
    // Create CSV
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Score', 'Status', 'Agent', 'State'],
      ...prospects.map(p => [
        p.prospect_data.name,
        p.prospect_data.email,
        p.prospect_data.phone,
        p.opportunity_score || 'N/A',
        p.status,
        p.assigned_agent_name || 'Unassigned',
        p.prospect_data.state || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Life event indicators
  const LifeEventIndicators: React.FC<{ prospect: Prospect }> = ({ prospect }) => {
    const lifeEvents = prospect.enrichment_data?.life_events || {};
    const indicators: React.ReactNode[] = [];

    if (lifeEvents.recently_married) {
      indicators.push(<Tooltip title="Recently Married"><span>💍</span></Tooltip>);
    }
    if (lifeEvents.new_baby) {
      indicators.push(<Tooltip title="New Baby"><span>👶</span></Tooltip>);
    }
    if (lifeEvents.home_purchase_last_18_months) {
      indicators.push(<Tooltip title="New Homeowner"><HomeIcon fontSize="small" /></Tooltip>);
    }
    if (lifeEvents.approaching_retirement) {
      indicators.push(<Tooltip title="Approaching Retirement"><BusinessIcon fontSize="small" /></Tooltip>);
    }

    return <Box sx={{ display: 'flex', gap: 1 }}>{indicators}</Box>;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Lead Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Min Score"
          type="number"
          size="small"
          value={filters.minScore}
          onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
          sx={{ width: 120 }}
        />
        <TextField
          label="Max Score"
          type="number"
          size="small"
          value={filters.maxScore}
          onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
          sx={{ width: 120 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="converted">Converted</MenuItem>
            <MenuItem value="nurture">Nurture</MenuItem>
          </Select>
        </FormControl>
        {!agentId && (
          <TextField
            label="State"
            size="small"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            sx={{ width: 120 }}
          />
        )}
      </Box>

      {/* Bulk Actions */}
      {selectedProspects.size > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleBulkAssign}
            startIcon={<PersonAddIcon />}
          >
            Assign ({selectedProspects.size})
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSelectedProspects(new Set())}
          >
            Clear Selection
          </Button>
        </Box>
      )}

      {/* Export Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Box>

      {/* Prospects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedProspects.size > 0 && selectedProspects.size < prospects.length}
                  checked={prospects.length > 0 && selectedProspects.size === prospects.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Life Events</TableCell>
              <TableCell>Current Carrier</TableCell>
              <TableCell>Days in System</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : prospects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography>No prospects found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              prospects.map((prospect) => {
                const daysInSystem = Math.floor(
                  (Date.now() - new Date(prospect.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <TableRow
                    key={prospect.id}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: getScoreColor(prospect.opportunity_score || 0) === 'hot' 
                        ? 'rgba(255, 0, 0, 0.1)' 
                        : getScoreColor(prospect.opportunity_score || 0) === 'warm'
                        ? 'rgba(255, 165, 0, 0.1)'
                        : getScoreColor(prospect.opportunity_score || 0) === 'cool'
                        ? 'rgba(0, 0, 255, 0.05)'
                        : 'transparent'
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProspects.has(prospect.id)}
                        onChange={(e) => handleSelectOne(e, prospect.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {prospect.prospect_data.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prospect.prospect_data.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Tooltip title="Call">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {prospect.prospect_data.phone}
                            </Typography>
                          </Box>
                        </Tooltip>
                        <Tooltip title="Email">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {prospect.prospect_data.email}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prospect.opportunity_score || 'N/A'}
                        color={getScoreChipColor(prospect.opportunity_score || 0)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>
                      <LifeEventIndicators prospect={prospect} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospect.prospect_data.current_carrier || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {daysInSystem} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {prospect.assigned_agent_name || 'Unassigned'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={prospect.status}
                        color={getStatusColor(prospect.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onSelectProspect?.(prospect)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default LeadList;
