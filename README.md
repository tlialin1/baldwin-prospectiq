# Baldwin Insurance - Lead Scoring & Enrichment Module

## Overview

A pluggable module that adds lead generation, enrichment, and scoring capabilities to the Baldwin Insurance Dashboard Platform. This module enriches prospect data with external APIs, scores them by conversion likelihood, and triggers automated actions based on score thresholds.

## Architecture

```
baldwin-leads-module/
├── backend/                    # Node.js API routes
├── enrichment-service/         # Python FastAPI microservice
├── frontend/src/components/    # React components
├── database/migrations/        # Database schema
├── tests/                      # Test suites
├── config/                     # Configuration templates
└── docs/                       # Documentation
```

## Quick Start

1. Install dependencies:
```bash
cd backend && npm install
cd enrichment-service && pip install -r requirements.txt
```

2. Configure environment variables:
```bash
cp config/.env.example config/.env
# Edit with your API keys
```

3. Run database migrations:
```bash
cd backend && npm run migrate
```

4. Start services:
```bash
# Terminal 1 - Backend API
npm run dev

# Terminal 2 - Enrichment Service
cd enrichment-service && uvicorn main:app --reload

# Terminal 3 - Trigger service
cd enrichment-service && python trigger_service.py
```

## Features

- **CSV/Excel Upload**: Drag-and-drop prospect data upload
- **Data Enrichment**: Zillow, Data Axle, social profiles, insurance records
- **Lead Scoring**: 0-100 opportunity score based on life events, finances, demographics
- **Auto-Triggering**: Automated assignments and campaigns based on scores
- **Agent Assignment**: Smart routing to top-performing agents
- **UI Integration**: Seamless fit with Baldwin dashboard design

## API Endpoints

- `POST /api/leads/upload` - Upload prospect data
- `GET /api/leads` - List prospects with filtering
- `GET /api/leads/:id` - Prospect details
- `PUT /api/leads/:id/assign` - Manual assignment
- `GET /api/leads/enrichment/queue` - Enrichment status

## Configuration

See `config/.env.example` for all environment variables including:
- API keys for Zillow, Data Axle
- Score thresholds
- Rate limits
- Feature toggles
