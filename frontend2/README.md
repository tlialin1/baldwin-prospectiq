# Baldwin Dashboard - React Version

## Deployment Instructions

### Option 1: Render Web Service

1. Create new Web Service on Render
2. Name: `baldwin-frontend2`
3. Runtime: `Node`
4. Root Directory: `frontend2`
5. Build Command: `npm install && npm run build`
6. Start Command: `npx serve -s build -l 10000`
7. Add PORT=10000 environment variable

### Option 2: If Build Fails

Use this simpler setup:

1. Create new Static Site on Render
2. Name: `baldwin-frontend2`
3. Build Command: (leave empty)
4. Publish Directory: `frontend2/build`

Then build locally:
```bash
cd frontend2
npm install
npm run build
git add build/
git commit -m "Add build files"
git push
```

## Files

- `src/App.js` - Main React component (plain CSS, no Material-UI)
- `src/index.js` - Entry point
- `package.json` - Dependencies (React only)
