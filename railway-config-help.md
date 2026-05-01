# Railway Config Options by Plan

## Where to Find Settings

### Step 1: Click on Service
Click on **frontend** service in your project

### Step 2: Look for Tabs
At the top of the service page:
```
[Deployments] [Logs] [Metrics] [Variables] [Settings]
```

### Step 3: Click Settings
The **Settings** tab should show:
- Custom Domain
- Healthcheck
- Start Command
- Build Command

## If Settings Tab is Missing

Some plans don't show all tabs. Try:

### Alternative: Variables Tab
1. Click **Variables** tab
2. Add variables directly:
   - `PORT=80`
   - `NODE_ENV=production`

### Alternative: Click Deployments
1. Click **Deployments** tab
2. Click on latest deployment
3. Look for "Redeploy" or "Configure"

## Railway Starter Plan Features

| Feature | Available |
|---------|-----------|
| Custom domains | ✅ Yes |
| Environment variables | ✅ Yes |
| Build logs | ✅ Yes |
| Healthchecks | ✅ Yes |
| Start command | ✅ Yes |

## If Still Missing

Try refreshing the page or logging out/back in.

Or contact Railway support: https://railway.app/help
