# Railway Watch Paths

## What Are Watch Paths?
Watch paths tell Railway which files to monitor for changes.

## Configuration

### For Backend
Watch paths should include:
```
backend/
Dockerfile.backend
railway.yaml
```

### For Frontend
Watch paths should include:
```
frontend/
Dockerfile.frontend
```

## How to Set

1. Click on **backend** service
2. Click **Settings** tab
3. Find **Watch Paths** section
4. Add:
   - `backend/`
   - `Dockerfile.backend`
   - `railway.yaml`

## Alternative: Use Root Directory

If available, set:
```
Root Directory: .
```

Or for specific services:
```
Root Directory: backend/
```

## Quick Fix

Try adding these watch paths:
```
.
backend/
Dockerfile.backend
```

This tells Railway to watch everything and rebuild when anything changes.
