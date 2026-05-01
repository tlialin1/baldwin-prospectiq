# API Documentation

## Base URL

All API endpoints are relative to: `/api/leads`

## Authentication

All endpoints require JWT authentication via the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## Response Format

All responses are JSON. Success responses include a `data` object. Error responses include an `error` message.

## Core Endpoints

### List Prospects

```http
GET /api/leads?status=pending&minScore=50&page=1&limit=20
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page, max 100 (default: 20)
- `status` (string, optional): Filter by status
- `minScore` (integer, optional): Minimum opportunity score (0-100)
- `maxScore` (integer, optional): Maximum opportunity score (0-100)
- `state` (string, optional): Filter by state
- `lifeEvent` (string, optional): Filter by life event type
- `assignedTo` (uuid, optional): Filter by assigned agent

**Response:**
```json
{
  "prospects": [
    {
      "id": "uuid",
      "agent_id": "uuid",
      "assigned_agent_id": "uuid",
      "assigned_agent_name": "John Agent",
      "prospect_data": {
        "name": "Jane Smith",
        "email": "jane@email.com",
        "phone": "555-123-4567",
        "address": "123 Main St",
        "state": "CA",
        "current_carrier": "State Farm"
      },
      "enrichment_data": {
        "demographics": { ... },
        "property": { ... },
        "confidence": 0.85,
        "enriched_at": "2024-01-15T10:30:00Z"
      },
      "opportunity_score": 85,
      "enrichment_confidence": 0.85,
      "status": "pending",
      "created_at": "2024-01-15T10:00:00Z",
      "last_contact_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Prospect Details

```http
GET /api/leads/{prospectId}
```

**Response:**
```json
{
  "id": "uuid",
  "prospect_data": {
    "name": "Jane Smith",
    "email": "jane@email.com",
    "phone": "555-123-4567",
    "address": "123 Main St, Springfield, IL 62701",
    "age": 35,
    "occupation": "Software Engineer",
    "current_carrier": "State Farm",
    "current_premium": 250
  },
  "enrichment_data": {
    "demographics": {
      "age": 35,
      "household_size": 4,
      "household_income": 95000,
      "age_range": "30-40",
      "income_range": "$85K-$110K",
      "length_of_residence": 3,
      "homeowner_status": "Owner",
      "educational_attainment": "Bachelor's Degree"
    },
    "property": {
      "estimated_value": 450000,
      "home_type": "Single Family",
      "year_built": 2015,
      "square_footage": 2800,
      "bedrooms": 4,
      "bathrooms": 3,
      "lot_size": 8500,
      "last_sold_date": "2023-06-15T00:00:00Z",
      "last_sold_price": 420000,
      "zestimate": 450000,
      "confidence": 0.88
    },
    "insurance": {
      "has_life_insurance": false,
      "current_carrier": "State Farm",
      "current_premium": 250,
      "coverage_amount": 500000,
      "policy_types": ["Term Life"],
      "coverage_gap": true,
      "years_with_current_carrier": 3,
      "renewal_date": "2024-06-15T00:00:00Z"
    },
    "social": {
      "linkedin": {
        "profile_url": "https://linkedin.com/in/janesmith",
        "headline": "Software Engineer at Tech Corp",
        "industry": "Technology",
        "connections": 150
      },
      "relationship_status": "Married",
      "facebook_profile": true,
      "connections": [
        {
          "name": "John Doe",
          "company": "Baldwin Insurance",
          "connection_strength": "strong"
        }
      ],
      "confidence": 0.75
    },
    "behavioral": {
      "multiple_quotes_requested": true,
      "quote_request_count": 2,
      "linked_to_baldwin_agent": true,
      "email_opens": 3,
      "website_visits": 2,
      "last_activity": "2024-01-14T15:30:00Z",
      "engagement_score": 65,
      "confidence": 0.70
    },
    "life_events": {
      "recently_married": true,
      "new_baby": true,
      "home_purchase_last_18_months": true,
      "approaching_retirement": false
    },
    "financial": {
      "property_value": 450000,
      "household_income": 95000,
      "current_premium": 250
    },
    "sources": {
      "demographics": 0.85,
      "property": 0.88,
      "insurance": 0.90,
      "social": 0.75,
      "behavioral": 0.70
    },
    "confidence": 0.85,
    "enriched_at": "2024-01-15T10:30:00Z"
  },
  "opportunity_score": 85,
  "enrichment_confidence": 0.85,
  "status": "pending",
  "source": "upload",
  "upload_id": "uuid",
  "assigned_agent_id": null,
  "assigned_agent_name": null,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "last_contact_at": null,
  "enrichment_history": [
    {
      "id": "uuid",
      "enrichment_source": "zillow",
      "data_fetched": { ... },
      "confidence": 0.88,
      "created_at": "2024-01-15T10:30:00Z",
      "status": "success"
    }
  ],
  "trigger_history": [
    {
      "id": "uuid",
      "trigger_type": "hot_lead_assignment",
      "action_taken": {
        "action": "assigned_to_agent",
        "agent_id": "uuid"
      },
      "executed_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Prospect

```http
POST /api/leads
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@email.com",
  "phone": "555-123-4567",
  "address": "123 Main St, Springfield, IL 62701",
  "age": 35,
  "occupation": "Software Engineer",
  "current_carrier": "State Farm",
  "current_premium": 250
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "agent_id": "uuid",
  "prospect_data": { ... },
  "enrichment_data": null,
  "opportunity_score": null,
  "status": "pending",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Update Prospect

```http
PUT /api/leads/{prospectId}
Content-Type: application/json

{
  "occupation": "Senior Software Engineer",
  "current_premium": 300
}
```

**Response:** `200 OK`

### Delete Prospect

```http
DELETE /api/leads/{prospectId}
```

**Response:** `200 OK`

```json
{
  "message": "Prospect deleted successfully"
}
```

### Manual Assignment

```http
PUT /api/leads/{prospectId}/assign
Content-Type: application/json

{
  "agent_id": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "assigned_agent_id": "uuid",
  "assigned_agent_name": "John Agent"
}
```

### Bulk Assign

```http
POST /api/leads/bulk/assign
Content-Type: application/json

{
  "prospect_ids": ["uuid1", "uuid2", "uuid3"],
  "agent_id": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "message": "3 prospects assigned successfully",
  "assigned_count": 3
}
```

## Upload Endpoints

### Upload CSV/Excel File

```http
POST /api/leads/upload
Content-Type: multipart/form-data

file: <binary_file_data>
```

**Response:** `200 OK`

```json
{
  "message": "File uploaded and processed successfully",
  "upload_id": "uuid",
  "total_records": 150,
  "processed": 145,
  "errors": 5,
  "error_details": [
    {
      "row": 23,
      "errors": ["Email is required", "Invalid phone format"],
      "warnings": ["Age appears to be invalid"],
      "data": {
        "name": "John Doe",
        "email": "",
        "phone": "invalid",
        "address": "123 Main St"
      }
    }
  ],
  "prospects": [
    {
      "id": "uuid",
      "prospect_data": { ... },
      "status": "pending",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Upload History

```http
GET /api/leads/upload/history
```

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "filename": "leads_january.csv",
    "status": "completed",
    "total_records": 150,
    "processed_records": 145,
    "error_records": 5,
    "created_at": "2024-01-15T10:00:00Z",
    "uploaded_by_name": "John Agent"
  }
]
```

### Get Upload Details

```http
GET /api/leads/upload/history/{uploadId}
```

**Response:** `200 OK`

```json
{
  "upload": {
    "id": "uuid",
    "filename": "leads_january.csv",
    "uploaded_by": "uuid",
    "uploaded_by_name": "John Agent",
    "status": "completed",
    "total_records": 150,
    "processed_records": 145,
    "error_records": 5,
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:02:00Z"
  },
  "prospects": [
    {
      "id": "uuid",
      "prospect_data": { ... },
      "status": "pending",
      "opportunity_score": 75,
      "created_at": "2024-01-15T10:01:00Z"
    }
  ]
}
```

## Enrichment Endpoints

### Get Enrichment Queue

```http
GET /api/leads/enrichment/queue?status=pending&limit=50
```

**Query Parameters:**
- `status` (string, optional): Filter by enrichment status
- `limit` (integer, optional): Max items to return (default: 50)

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Jane Smith",
    "opportunity_score": null,
    "enrichment_confidence": null,
    "status": "pending",
    "enrichment_attempts": 0,
    "last_enrichment_at": null
  }
]
```

### Get Enrichment Statistics

```http
GET /api/leads/enrichment/stats
```

**Response:** `200 OK`

```json
{
  "overall": {
    "total_prospects": 1500,
    "enriched_count": 1200,
    "pending_count": 300,
    "avg_confidence": 0.78,
    "max_confidence": 0.95,
    "min_confidence": 0.45
  },
  "api_breakdown": [
    {
      "enrichment_source": "zillow",
      "total_calls": 1200,
      "avg_confidence": 0.85,
      "success_count": 1150,
      "failed_count": 50
    },
    {
      "enrichment_source": "data_axle",
      "total_calls": 1180,
      "avg_confidence": 0.75,
      "success_count": 1120,
      "failed_count": 60
    }
  ]
}
```

### Retry Enrichment

```http
POST /api/leads/enrichment/{prospectId}/retry
Content-Type: application/json

{
  "force": true
}
```

**Response:** `200 OK`

```json
{
  "message": "Re-enrichment triggered successfully"
}
```

### Get API Quota Usage

```http
GET /api/leads/enrichment/quota
```

**Response:** `200 OK`

```json
{
  "zillow": {
    "daily_limit": 1000,
    "used_today": 234,
    "remaining": 766,
    "reset_at": "2024-01-16T00:00:00Z"
  },
  "data_axle": {
    "daily_limit": 500,
    "used_today": 145,
    "remaining": 355,
    "reset_at": "2024-01-16T00:00:00Z"
  }
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": "Description of what went wrong"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

### Validation Errors

```json
{
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Invalid email format",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## Rate Limiting

All endpoints are rate-limited:
- 100 requests per 15-minute window per IP
- Upload endpoint: 10 files per 15-minute window
- Enrichment endpoints: 1000 requests per day per API key

## Webhook Support (Future)

Enrichment service can send webhooks when:
- Enrichment completes
- Lead score changes
- Trigger actions fire

Configure webhook URL in `.env`:

```bash
WEBHOOK_URL=https://your-app.com/webhooks/baldwin-leads
WEBHOOK_SECRET=your_webhook_secret
```

Webhook payload:
```json
{
  "event": "enrichment.completed",
  "prospect_id": "uuid",
  "score": 85,
  "enriched_at": "2024-01-15T10:30:00Z",
  "signature": "hmac_signature"
}
```
