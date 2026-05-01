# Baldwin-ProspectIQ — Railway Deploy Guide

## Quick Deploy (5 minutes)

### 1. Push to GitHub
```bash
cd /Users/tlialin/.openclaw/workspace/baldwin-leads-module
git init
git add .
git commit -m "Initial commit for Railway deploy"
git remote add origin https://github.com/YOUR_USERNAME/baldwin-prospectiq.git
git push -u origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `baldwin-prospectiq`
5. Railway auto-detects `railway.yaml` and provisions:
   - Backend service (Node.js)
   - Enrichment service (Python)
   - PostgreSQL database
   - Frontend (React/nginx)

### 3. Set Environment Variables
In Railway dashboard, add these to each service:

**Backend:**
```
NODE_ENV=production
DB_HOST=${{Postgres.POSTGRES_HOST}}
DB_PORT=5432
DB_NAME=baldwin_prospectiq
DB_USER=baldwin
DB_PASSWORD=${{Postgres.POSTGRES_PASSWORD}}
ENRICHMENT_SERVICE_URL=https://baldwin-prospectiq-enrichment.up.railway.app
JWT_SECRET=your-jwt-secret-here
```

**Enrichment:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
ZILLOW_API_KEY=your-zillow-key
DATA_AXLE_API_KEY=your-data-axle-key
OPENAI_API_KEY=your-openai-key
```

### 4. Deploy
Railway auto-deploys on every git push. First deploy takes ~3 minutes.

### 5. Custom Domain
1. In Railway dashboard, go to your frontend service
2. Click "Settings" → "Domains"
3. Add custom domain: `app.baldwin-prospectiq.com`
4. Railway gives you a DNS target
5. In GoDaddy, add CNAME record pointing to Railway target

### 6. SSL
Railway auto-provisions SSL certificates for custom domains.

---

## Architecture on Railway

```
┌─────────────────┐
│   Custom Domain │  app.baldwin-prospectiq.com
│   (GoDaddy)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Railway Edge   │  SSL + CDN
│  (Auto)         │
└────────┬────────┘
         │
┌────────▼────────┐
│    Frontend     │  React + nginx
│    Service      │  (Docker)
└────────┬────────┘
         │
┌────────▼────────┐
│    Backend      │  Node.js API
│    Service      │  (Docker)
└────────┬────────┘
         │
┌────────▼────────┐     ┌─────────────────┐
│   Enrichment    │────▶│   External APIs │
│   Service       │     │   (Zillow, etc) │
│   (Python)      │     └─────────────────┘
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Managed DB
│   (Railway)     │
└─────────────────┘
```

---

## Costs

| Component | Cost |
|-----------|------|
| Backend service | ~$5/month |
| Enrichment service | ~$5/month |
| Frontend service | ~$5/month |
| PostgreSQL | ~$10/month |
| **Total** | **~$25/month** |

Free tier: $5/month credit (enough for basic testing)

---

## Monitoring

Railway provides:
- Real-time logs
- CPU/memory metrics
- Database metrics
- Custom alerts

---

## Scaling

Railway auto-scales based on:
- CPU usage (>70% = scale up)
- Memory usage
- Request queue depth

Manual scale: Set `replicas: 3` in railway.yaml

---

## Backup & Recovery

Railway PostgreSQL:
- Daily automated backups
- Point-in-time recovery
- Manual snapshots

To restore:
```bash
railway connect postgres
pg_restore --clean --if-exists backup.sql
```

---

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Baldwin-ProspectIQ Issues: GitHub Issues
