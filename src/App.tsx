import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container, Tabs, Tab } from '@mui/material';
import UploadLeads from './components/UploadLeads';
import LeadList from './components/LeadList';
import EnrichmentQueue from './components/EnrichmentQueue';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🎯 Baldwin-ProspectIQ
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
            <Tab label="Upload Leads" />
            <Tab label="Lead List" />
            <Tab label="Enrichment Queue" />
          </Tabs>
          {tab === 0 && <UploadLeads />}
          {tab === 1 && <LeadList />}
          {tab === 2 && <EnrichmentQueue />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
