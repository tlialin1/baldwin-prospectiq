# Frontend Components

This directory contains React TypeScript components for the Lead Scouring & Enrichment Module.

## Components

### 1. LeadList.tsx
Main prospect list view with sorting, filtering, and bulk actions.

**Features:**
- ✅ Data table with pagination
- ✅ Real-time score coloring (red/orange/blue/gray)
- ✅ Life event indicators (💍👶🏠)
- ✅ Sorting by score, date, status
- ✅ Filtering by score range, state, status
- ✅ Bulk actions (assign, export)
- ✅ CSV export functionality

**Usage:**
```tsx
import LeadList from './components/LeadList';

<LeadList agentId={currentAgentId} onSelectProspect={handleSelect} />
```

### 2. ProspectDetail.tsx
Detailed single prospect view with enrichment data and score breakdown.

**Features:**
- ✅ Comprehensive prospect information
- ✅ Score breakdown visualization
- ✅ Life events timeline
- ✅ Enrichment data display
- ✅ Recommended actions
- ✅ Re-enrichment trigger
- ✅ Manual score adjustment (admin)

**Usage:**
```tsx
import ProspectDetail from './components/ProspectDetail';

<ProspectDetail prospectId={selectedId} onClose={handleClose} />
```

### 3. UploadLeads.tsx
Drag-and-drop file upload component with validation.

**Features:**
- ✅ CSV/Excel file support
- ✅ Drag-and-drop interface
- ✅ Progress tracking
- ✅ Error reporting
- ✅ Upload history
- ✅ CSV format specification guide
- ✅ Template download

**Usage:**
```tsx
import UploadLeads from './components/UploadLeads';

<UploadLeads />
```

### 4. EnrichmentQueue.tsx
Admin view for monitoring enrichment status and API quotas.

**Features:**
- ✅ Enrichment queue monitoring
- ✅ API quota tracking
- ✅ Success/failure rates
- ✅ Manual retry capability
- ✅ Real-time statistics

**Usage:**
```tsx
import EnrichmentQueue from './components/EnrichmentQueue';

<EnrichmentQueue />
```

## Installation

```bash
npm install
```

## Dependencies

- @mui/material - UI components
- @mui/icons-material - Material icons
- react-dropzone - File upload drag-and-drop
- axios - HTTP client

Add to your package.json:
```json
{
  "@mui/material": "^5.14.0",
  "@mui/icons-material": "^5.14.0",
  "react-dropzone": "^14.2.0",
  "axios": "^1.4.0"
}
```

## State Management

Components use React hooks with TypeScript interfaces:
- `useState` for local component state
- `useEffect` for data fetching
- `useCallback` for event handlers

## Styling

Components use Material-UI v5 with:
- Theme-aware color palette
- Responsive design
- Consistent spacing (theme.spacing())
- Dark theme compatible

## API Integration

All components expect:
- JWT token in localStorage under 'token' key
- Base URL at `/api/leads`
- Error responses with `{ error: string }`

## TypeScript Interfaces

```typescript
interface Prospect {
  id: string;
  prospect_data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    [key: string]: any;
  };
  enrichment_data?: any;
  opportunity_score: number | null;
  enrichment_confidence: number | null;
  status: string;
  created_at: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
}
```

## Error Handling

Components display errors using MUI Alert components:
- Network errors
- Validation errors
- Server errors

## Performance

- Virtual scrolling for large lists (future enhancement)
- Debounced search/filter inputs
- Optimized re-renders with React.memo where needed
- Lazy loading for prospect details

## Testing

Run component tests:

```bash
npm test
```

Recommended test libraries:
- Jest
- React Testing Library
- @testing-library/react

## Future Enhancements

- [ ] Virtual scrolling for 1000+ prospects
- [ ] Advanced filters (multi-select, date ranges)
- [ ] Prospect comparison view
- [ ] Agent performance dashboard
- [ ] Export to PDF reports
- [ ] Real-time updates with WebSockets