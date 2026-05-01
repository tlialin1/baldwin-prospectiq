import React, { useState, useCallback } from 'react';
import {
  Box, Paper, Button, Typography, Alert, CircularProgress,
  List, ListItem, ListItemText, Chip, LinearProgress
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface UploadResult {
  upload_id: string;
  total_records: number;
  processed: number;
  errors: number;
  message: string;
}

const UploadRecords: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.match(/\.(csv|xlsx|xls|png|jpg|jpeg)$/i)) {
      setError('Invalid file type. Please upload CSV, Excel, or image files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/records/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadResult(data);
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
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false
  });

  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop NAA screenshots or CSV files'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse (max 10MB)
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Uploading... {progress}%
          </Typography>
        </Box>
      )}

      {uploadResult && (
        <Paper sx={{ mt: 2, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Complete
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Total Records"
                secondary={uploadResult.total_records}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Processed"
                secondary={uploadResult.processed}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Errors"
                secondary={uploadResult.errors}
              />
            </ListItem>
          </List>
          <Chip
            label={uploadResult.message}
            color={uploadResult.errors > 0 ? 'warning' : 'success'}
            sx={{ mt: 1 }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default UploadRecords;
