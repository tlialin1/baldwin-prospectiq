# Baldwin-ProspectIQ Railway Setup - Step by Step

## Step 1: Click on Backend Service

In your Railway project dashboard:

```
┌─────────────────────────────────────┐
│  Baldwin-ProspectIQ                 │
│                                     │
│  Services:                          │
│  ┌──────────┐                       │
│  │ backend  │  ← CLICK THIS        │
│  └──────────┘                       │
│  ┌──────────┐                       │
│  │enrichment│                       │
│  └──────────┘                       │
│  ┌──────────┐                       │
│  │ frontend │                       │
│  └──────────┘                       │
│  ┌──────────┐                       │
│  │ postgres │                       │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

## Step 2: Go to Variables Tab

After clicking backend, you'll see tabs at the top:

```
┌─────────────────────────────────────┐
│  backend                            │
│                                     │
│  [Deployments] [Variables] [Settings]│
│              ↑                      │
│         CLICK THIS                  │
└─────────────────────────────────────┘
```

## Step 3: Add Variables

Click "New Variable" button and add these one by one:

### Variable 1: DATABASE_URL
```
Name:  DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
```

### Variable 2: NODE_ENV
```
Name:  NODE_ENV
Value: production
```

### Variable 3: PORT
```
Name:  PORT
Value: 3000
```

### Variable 4: JWT_SECRET
```
Name:  JWT_SECRET
Value: baldwin-prospectiq-secret-key-2024
```

## Step 4: Click on Enrichment Service

Go back to project, click "enrichment"

## Step 5: Add Enrichment Variables

```
Name:  DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
```

```
Name:  PORT
Value: 8000
```

## Step 6: Check Deployments

After adding variables, Railway auto-redeploys. Check:

```
[Deployments] tab → look for green checkmark ✅
```

If red ❌, click on it to see error logs.

## Done!

Your app should be live at:
- Backend: https://backend-yourproject.up.railway.app
- Frontend: https://frontend-yourproject.up.railway.app
