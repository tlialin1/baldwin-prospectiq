import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, LinearProgress, CircularProgress
} from '@mui/material';

interface Policy {
  id: string;
  client_name: string;
  policy_number: string;
  carrier: string;
  monthly_premium: number;
  face_amount: number;
  issue_date: string;
  status: string;
}

const BookAnalytics: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPolicies([
        {
          id: '1',
          client_name: 'John Smith',
          policy_number: 'POL-001',
          carrier: 'Mutual of Omaha',
          monthly_premium: 250,
          face_amount: 500000,
          issue_date: '2024-01-15',
          status: 'Active'
        },
        {
          id: '2',
          client_name: 'Sarah Johnson',
          policy_number: 'POL-002',
          carrier: 'AIG',
          monthly_premium: 180,
          face_amount: 350000,
          issue_date: '2024-02-20',
          status: 'Active'
        },
        {
          id: '3',
          client_name: 'Michael Brown',
          policy_number: 'POL-003',
          carrier: 'Prudential',
          monthly_premium: 320,
          face_amount: 750000,
          issue_date: '2023-11-10',
          status: 'Pending'
        }
      ]);
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

  const totalPremium = policies.reduce((sum, p) => sum + p.monthly_premium, 0);
  const totalFaceAmount = policies.reduce((sum, p) => sum + p.face_amount, 0);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Book Analytics
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Portfolio Summary
          </Typography>
          <Box display="flex" gap={4}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Policies
              </Typography>
              <Typography variant="h4">{policies.length}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Premium
              </Typography>
              <Typography variant="h4">${totalPremium.toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Total Face Amount
              </Typography>
              <Typography variant="h4">${totalFaceAmount.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Policy #</TableCell>
              <TableCell>Carrier</TableCell>
              <TableCell align="right">Monthly Premium</TableCell>
              <TableCell align="right">Face Amount</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>{policy.client_name}</TableCell>
                <TableCell>{policy.policy_number}</TableCell>
                <TableCell>{policy.carrier}</TableCell>
                <TableCell align="right">${policy.monthly_premium}</TableCell>
                <TableCell align="right">${policy.face_amount.toLocaleString()}</TableCell>
                <TableCell>{policy.issue_date}</TableCell>
                <TableCell>
                  <Chip
                    label={policy.status}
                    color={policy.status === 'Active' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BookAnalytics;
