import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Description as FileIcon,
  History as HistoryIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface UploadResult {
  upload_id: string;
  total_records: number;
  processed: number;
  errors: number;
  error_details: Array<{
    row: number;
    errors: string[];
    warnings?: string[];
    data: any;
  }>;
  prospects: any[];
  message: string;
}

interface UploadHistory {
  id: string;
  filename: string;
  status: string;
  total_records: number;
  processed_records: number;
  error_records: number;
  created_at: string;
  uploaded_by_name?: string;
}

const UploadLeads: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<UploadHistory | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Invalid file type. Please upload CSV or Excel files only.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      fetchUploadHistory(); // Refresh history
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  // Fetch upload history
  const fetchUploadHistory = async () => {
    try {
      const response = await fetch('/api/leads/upload/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setUploadHistory(data);
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
    }
  };

  React.useEffect(() => {
    fetchUploadHistory();
  }, []);

  const getStatusChipColor = (status: string): any => {
    const colors: Record<string, any> = {
      'processing': 'info',
      'completed': 'success',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const getFileIconColor = (filename: string): string => {
    if (filename.endsWith('.csv')) return '#2e7d32';
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return '#1565c0';
    return '#757575';
  };

  // Show history details
  const showHistoryDetails = async (history: UploadHistory) => {
    try {
      const response = await fetch(`/api/leads/upload/history/${history.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch history details');

      const data = await response.json();
      setSelectedHistory(data);
    } catch (err) {
      setError('Failed to load upload details');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Upload Leads
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center'
        }}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        <UploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the file here' : 'Upload CSV or Excel File'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag and drop your file here, or click to browse
        </Typography>
        
        <Button
          variant="contained"
          disabled={uploading}
          sx={{ pointerEvents: 'none' }}
        >
          Choose File
        </Button>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Supported formats: CSV, XLS, XLSX (Max size: 10MB)
        </Typography>
      </Paper>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Processing file...</Typography>
        </Box>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Upload completed successfully!
            </Typography>
          </Alert>

          {/* Summary Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {uploadResult.total_records}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h5" color="success.main">
                {uploadResult.processed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processed
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 120, textAlign: 'center' }}>
              <Typography variant="h5" color="error.main">
                {uploadResult.errors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Errors
              </Typography>
            </Paper>
          </Box>

          {/* Error Details */}
          {uploadResult.error_details && uploadResult.error_details.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                Error Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing first {Math.min(uploadResult.error_details.length, 10)} of {uploadResult.error_details.length} errors
              </Typography>
              <List dense>
                {uploadResult.error_details.slice(0, 10).map((error, idx) => (
                  <ListItem key={idx} sx={{ py: 0.5 }}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Row ${error.row}: ${error.data.name || 'Unknown'}`}
                      secondary={
                        <Box component="span">
                          {error.errors.map((err, i) => (
                            <Chip
                              key={i}
                              label={err}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {error.warnings && error.warnings.map((warn, i) => (
                            <Chip
                              key={i}
                              label={warn}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Created Prospects Preview */}
          {uploadResult.prospects && uploadResult.prospects.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Created Prospects (First 10)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>State</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadResult.prospects.map((prospect) => (
                      <TableRow key={prospect.id}>
                        <TableCell>{prospect.prospect_data.name}</TableCell>
                        <TableCell>{prospect.prospect_data.email}</TableCell>
                        <TableCell>{prospect.prospect_data.phone}</TableCell>
                        <TableCell>{prospect.prospect_data.state || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {/* Upload History */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Upload History
          </Typography>
          <Button
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
        </Box>

        {showHistory && (
          <Paper>
            <List>
              {uploadHistory.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No upload history available" />
                </ListItem>
              ) : (
                uploadHistory.map((history) => (
                  <ListItem
                    key={history.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => showHistoryDetails(history)}
                      >
                        <ViewIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FileIcon sx={{ color: getFileIconColor(history.filename) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={history.filename}
                      secondary={
                        <Box component="span">
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="caption">
                              {new Date(history.created_at).toLocaleString()}
                            </Typography>
                            {history.uploaded_by_name && (
                              <Typography variant="caption" color="text.secondary">
                                by {history.uploaded_by_name}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={history.status}
                              size="small"
                              color={getStatusChipColor(history.status)}
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`${history.processed_records}/${history.total_records} processed`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            {history.error_records > 0 && (
                              <Chip
                                label={`${history.error_records} errors`}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* CSV Format Specification */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            CSV Format Specification
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your CSV or Excel file should include the following columns:
          </Typography>
          
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: '1px solid #ddd' }}>
                <Box component="th" sx={{ textAlign: 'left', p: 1, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2">Column</Typography>
                </Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2">Required</Typography>
                </Box>
                <Box component="th" sx={{ textAlign: 'left', p: 1, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2">Description</Typography>
                </Box>
              </Box>
            </Box>
            <Box component="tbody">
              {[
                ['name', 'Required', 'Full name of prospect'],
                ['email', 'Required', 'Valid email address'],
                ['phone', 'Required', 'Phone number with area code'],
                ['address', 'Required', 'Full street address'],
                ['age', 'Optional', 'Age in years'],
                ['occupation', 'Optional', 'Job title or occupation'],
                ['current_carrier', 'Optional', 'Current insurance carrier'],
                ['current_premium', 'Optional', 'Current monthly premium (number)']
              ].map((row) => (
                <Box component="tr" key={row[0]} sx={{ borderBottom: '1px solid #eee' }}>
                  <Box component="td" sx={{ p: 1, fontFamily: 'monospace' }}>
                    <Typography variant="body2">{row[0]}</Typography>
                  </Box>
                  <Box component="td" sx={{ p: 1 }}>
                    <Chip
                      label={row[1]}
                      size="small"
                      color={row[1] === 'Required' ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                  <Box component="td" sx={{ p: 1 }}>
                    <Typography variant="body2">{row[2]}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            <strong>Tip:</strong> Make sure your file has headers matching these column names exactly.
            Extra columns will be ignored.
          </Typography>
        </Paper>
      </Box>

      {/* History Details Dialog */}
      <Dialog
        open={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Upload Details: {selectedHistory?.upload.filename}
        </DialogTitle>
        <DialogContent>
          {selectedHistory && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Uploaded: {new Date(selectedHistory.upload.created_at).toLocaleString()} by {selectedHistory.upload.uploaded_by_name || 'Unknown'}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${selectedHistory.upload.status}`}
                  color={getStatusChipColor(selectedHistory.upload.status)}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${selectedHistory.prospects?.length || 0} prospects created`}
                  variant="outlined"
                />
              </Box>

              {/* Prospects Created */}
              {selectedHistory.prospects && selectedHistory.prospects.length > 0 && (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Current Carrier</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedHistory.prospects.map((prospect: any) => (
                        <TableRow key={prospect.id}>
                          <TableCell>{prospect.prospect_data.name}</TableCell>
                          <TableCell>{prospect.prospect_data.email}</TableCell>
                          <TableCell>{prospect.prospect_data.phone}</TableCell>
                          <TableCell>{prospect.prospect_data.current_carrier || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={prospect.status}
                              size="small"
                              color={prospect.opportunity_score >= 75 ? 'error' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedHistory(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadLeads;
