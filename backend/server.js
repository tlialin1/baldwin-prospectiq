const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'baldwin-prospectiq-backend' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Baldwin-ProspectIQ API', version: '1.0.0' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
