# Railway Frontend Build Debug

## Common Build Failures

### 1. "Dockerfile not found"
**Fix:** Ensure `Dockerfile.frontend` is in repo root

### 2. "index.html not found"
**Fix:** Ensure `index.html` is in repo root

### 3. "Port not exposed"
**Fix:** Must have `EXPOSE 80` in Dockerfile

### 4. "Build context error"
**Fix:** Use simpler Dockerfile

## Minimal Working Dockerfile

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Files Needed in Repo

```
baldwin-leads-module/
├── Dockerfile          ← This one
├── index.html          ← Static page
└── ...
```

## Check Build Logs

In Railway dashboard:
1. Click on **frontend** service
2. Click **Deployments** tab
3. Click on the **red ❌** deployment
4. Read the error message

## Quick Fix

If build keeps failing, try:
1. Delete `Dockerfile.frontend` (use `Dockerfile` only)
2. Simplify `index.html`
3. Push again

## Alternative: No Frontend

If frontend keeps failing, just use backend directly:
```
https://backend-yourproject.up.railway.app/health
```

You can add frontend later!
