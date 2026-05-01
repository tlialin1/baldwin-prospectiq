# Baldwin Insurance Dashboard Integration Guide

This guide explains how to integrate the Lead Scoring & Enrichment Module into the existing Baldwin Insurance Dashboard Platform.

## Prerequisites

- Node.js 18+ and npm 8+
- Python 3.9+ with pip
- PostgreSQL 13+
- AWS Account (optional, for S3 uploads)
- Twilio Account (optional, for SMS notifications)
- React 18+ with TypeScript

## Installation Steps

### 1. Clone and Install

```bash
git clone https://github.com/your-org/baldwin-leads-module.git
cd baldwin-leads-module
npm run setup
```

This will:
- Install Node.js dependencies for the backend
- Install Python dependencies for the enrichment service
- Set up the database with migrations

### 2. Database Migration

Run the migration script to create new tables:

```bash
npm run migrate
```

This creates three new tables:
- `prospects` - Stores enriched prospect data
- `lead_enrichment_log` - Audit trail of enrichment attempts
- `lead_triggers` - Log of automated actions triggered

These tables integrate with your existing `agents` table for assignments.

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp config/.env.example config/.env
```

Key configurations:
- `DATABASE_URL` - Must match your existing Baldwin database
- `ENRICHMENT_SERVICE_URL` - Where the Python service will run
- API keys for Zillow, Data Axle (optional, uses mocks by default)
- `JWT_SECRET` - Should match your existing Baldwin JWT secret

### 4. Start Services

**Development Mode:**

```bash
# Terminal 1 - Backend API
npm run dev:backend

# Terminal 2 - Enrichment Service
npm run dev:enrichment
```

**Production Mode:**

```bash
npm start
```

### 5. Register Routes with Main Application

In your Baldwin Dashboard's main server file:

```javascript
// Add lead management routes
const leadsRoutes = require('./baldwin-leads-module/backend/routes/leads');
const uploadRoutes = require('./baldwin-leads-module/backend/routes/upload');
const enrichmentRoutes = require('./baldwin-leads-module/backend/routes/enrichment');

app.use('/api/leads', leadsRoutes.router);
app.use('/api/leads/upload', uploadRoutes);
app.use('/api/leads/enrichment', enrichmentRoutes);
```

### 6. Frontend Integration

Add the React components to your Baldwin Dashboard:

```typescript
// In your main Dashboard component
import LeadList from './baldwin-leads-module/frontend/src/components/LeadList';
import UploadLeads from './baldwin-leads-module/frontend/src/components/UploadLeads';
import ProspectDetail from './baldwin-leads-module/frontend/src/components/ProspectDetail';
```

Add routes in your main App component:

```typescript
<Routes>
  {/* Existing routes */}
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/admin" element={<Admin />} />
  
  {/* New Lead Management Routes */}
  <Route path="/leads" element={<LeadList />} />
  <Route path="/leads/upload" element={<UploadLeads />} />
  <Route path="/leads/:prospectId" element={<ProspectDetail />} />
</Routes>
```

### 7. Navigation Menu

Add "Lead Management" to your navigation menu between "Dashboard" and "Admin":

```typescript
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/leads', label: 'Lead Management', icon: PeopleIcon, roles: ['agent', 'manager', 'admin'] },
  { path: '/admin', label: 'Admin', icon: AdminIcon, roles: ['admin'] }
];
```

### 8. Authentication Integration

The module uses your existing JWT middleware. Ensure the JWT secret matches:

```javascript
// In your auth middleware
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### 9. Role-Based Access Control

The module respects your existing role system:

- **agent**: Can view leads, upload files, view prospects
- **manager**: Can assign leads, view reports, override auto-assignment
- **admin**: Can configure triggers, view queue, manage enrichment

Add this to your user model:

```sql
-- If not already present
ALTER TABLE agents ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'agent';
```

## Database Schema Notes

### New Tables Created:

1. **prospects** table integrates with existing agents table:
   ```sql
   -- Foreign key to agents (uploaded by)
   ALTER TABLE prospects ADD CONSTRAINT fk_prospects_agent 
   FOREIGN KEY (agent_id) REFERENCES agents(id);
   
   -- Foreign key to agents (assigned to)
   ALTER TABLE prospects ADD CONSTRAINT fk_prospects_assigned_agent 
   FOREIGN KEY (assigned_agent_id) REFERENCES agents(id);
   ```

2. **No changes to existing tables** - Safe to install alongside current system

3. **JSONB fields** for flexible enrichment data without schema changes

## API Endpoints

All endpoints are namespaced under `/api/leads/*`:

### Core Endpoints

- `GET /api/leads` - List prospects with filtering
- `GET /api/leads/:id` - Get prospect details
- `POST /api/leads` - Create single prospect
- `PUT /api/leads/:id` - Update prospect
- `PUT /api/leads/:id/assign` - Manual agent assignment
- `DELETE /api/leads/:id` - Soft delete prospect

### Upload Endpoints

- `POST /api/leads/upload` - Upload CSV/Excel file
- `GET /api/leads/upload/history` - Upload history
- `GET /api/leads/upload/history/:id` - Upload details

### Enrichment Endpoints

- `GET /api/leads/enrichment/queue` - Enrichment queue status
- `GET /api/leads/enrichment/stats` - Enrichment statistics
- `POST /api/leads/enrichment/:id/retry` - Manual re-enrichment
- `GET /api/leads/enrichment/quota` - API quota usage

## Frontend Styling

The module uses Material-UI components that match Baldwin's design system:

- **Dark theme** compatible
- **Consistent spacing** with `theme.spacing()`
- **Shared color palette** - import from your theme
- **Responsive design** - works on desktop and tablet

To customize colors, update the theme in each component:

```typescript
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
// Use theme.colors.primary, etc.
```

## Testing

Run the full test suite:

```bash
npm test
```

Test individual components:

```bash
# Backend API tests
cd backend && npm test

# Scoring algorithm tests
npm run test:scoring

# Enrichment service tests
npm run test:enrichment
```

## Configuration for Production

### 1. Real API Keys

Set `USE_MOCK_APIS=false` and add real API keys:

```bash
# In config/.env
USE_MOCK_APIS=false
ZILLOW_API_KEY=your_real_key
DATA_AXLE_API_KEY=your_real_key
```

### 2. S3 Uploads

Enable S3 for file storage:

```bash
ENABLE_S3_UPLOAD=true
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=baldwin-leads
```

### 3. SMS Notifications

Enable Twilio for agent notifications:

```bash
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
```

### 4. Database Optimization

Add indexes for performance:

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_prospects_score_status ON prospects(opportunity_score DESC, status);
CREATE INDEX CONCURRENTLY idx_prospects_created ON prospects(created_at DESC);
CREATE INDEX CONCURRENTLY idx_enrichment_log_prospect_source ON lead_enrichment_log(prospect_id, enrichment_source);
```

## Monitoring

### Enrichment Queue Monitoring

Access the enrichment queue at `/api/leads/enrichment/queue`

- Monitor API quota usage
- Retry failed enrichments
- View success rates by source

### Lead Score Distribution

Query score distribution:

```sql
SELECT 
  CASE 
    WHEN opportunity_score >= 75 THEN 'Hot'
    WHEN opportunity_score >= 50 THEN 'Warm'
    WHEN opportunity_score >= 25 THEN 'Cool'
    ELSE 'Cold'
  END as tier,
  COUNT(*) as count
FROM prospects
WHERE enrichment_data IS NOT NULL
GROUP BY tier
ORDER BY tier;
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to enrichment service"**
   - Ensure enrichment service is running on port 8000
   - Check `ENRICHMENT_SERVICE_URL` in .env

2. **"Authentication failed"**
   - Verify JWT_SECRET matches your Baldwin dashboard
   - Check token is being sent in Authorization header

3. **"Database error: relation does not exist"**
   - Run migrations: `npm run migrate`
   - Check database connection string

4. **Enrichment stuck at pending**
   - Check enrichment service logs
   - Verify API keys or mock mode setting
   - Manually retry from enrichment queue UI

### Logs

- Backend logs: `backend/server.log`
- Enrichment logs: `enrichment-service/enrichment_service.log`
- Test logs: `coverage/` directory

## Security Considerations

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Rotate API keys** regularly
3. **Use HTTPS** in production
4. **Validate file uploads** - Only CSV/Excel, size limits enforced
5. **SQL injection protection** - Parameterized queries used throughout
6. **XSS protection** - React automatically escapes, backend uses Helmet

## Support

For issues or questions:
1. Check logs in respective service directories
2. Review test cases for examples
3. Check monitoring dashboard at `/api/leads/enrichment/stats`
4. Review trigger logs in `lead_triggers` table

## Next Steps

After successful integration:

1. **Train agents** on score interpretation
2. **Set up SMS notifications** for hot leads
3. **Configure CRM integration** for follow-ups
4. **Monitor conversion rates** by score tier
5. **Tune scoring algorithm** based on results
6. **Enable real APIs** when ready for production

## Uninstall (if needed)

To remove the module:

```bash
# Drop the tables (this will lose all lead data)
psql -d baldwin_insurance -c "DROP TABLE lead_triggers, lead_enrichment_log, prospects, uploads;"

# Remove routes from main application
# Remove frontend components
# Remove navigation menu items
```

**Warning**: This will permanently delete all lead data!

---

For more detailed information, see:
- [API Documentation](./API_DOCUMENTATION.md)
- [Scoring Algorithm](./SCORING_ALGORITHM.md)
- [Trigger Configuration](./TRIGGER_CONFIGURATION.md)
