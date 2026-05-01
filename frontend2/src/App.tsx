import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Container, Tabs, Tab } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
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
              🎯 Baldwin Dashboard (React)
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} centered>
            <Tab label="📤 Upload" />
            <Tab label="📊 Dashboard" />
            <Tab label="📈 Analytics" />
            <Tab label="🏆 Promotion" />
          </Tabs>
          {tab === 0 && <div>Upload Component</div>}
          {tab === 1 && <div>Dashboard Component</div>}
          {tab === 2 && <div>Analytics Component</div>}
          {tab === 3 && <div>Promotion Component</div>}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
