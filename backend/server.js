const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'baldwin-prospectiq-backend',
      port: PORT,
      time: new Date().toISOString(),
      endpoints: ['/health', '/']
    }));
    return;
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end(JSON.stringify({ 
    status: 'error', 
    message: 'Not found',
    path: req.url
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});
