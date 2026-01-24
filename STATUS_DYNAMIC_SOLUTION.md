# Dynamic Status Labels Solution

## Problem
Frontend had hardcoded status labels that would break when backend changed status labels. For example, if backend changed "Waiting Subscription" to "Waiting", frontend would show "Unknown" status.

## Solution
Created a dynamic status system where:
1. **Backend is the single source of truth** - Status labels come from `FFDServiceProvisionStatus` enum
2. **API endpoint** - `/api/v1/status-definitions` returns all status definitions
3. **Frontend fetches dynamically** - Frontend fetches status definitions on app load
4. **API responses include labels** - `SurveyOrderResource` now includes `status_label` field

## Implementation

### Backend Changes

#### 1. New Controller: `StatusController`
- **File**: `app/Http/Controllers/Api/v1/StatusController.php`
- **Endpoint**: `GET /api/v1/status-definitions`
- **Returns**: All status values, labels, and lookup maps

#### 2. Updated Resource: `SurveyOrderResource`
- **File**: `app/Http/Resources/SurveyOrderResource.php`
- **Added**: `status_label` field that uses `FFDServiceProvisionStatus::label()`
- **Benefit**: API responses now include both numeric `status` and human-readable `status_label`

#### 3. Route Added
- **File**: `routes/api.php`
- **Route**: Public endpoint (no auth required) for status definitions

### Frontend Changes

#### 1. New Service: `status-service.ts`
- **File**: `resources/js/lib/status-service.ts`
- **Features**:
  - Fetches status definitions from API
  - Caches results to avoid multiple requests
  - Provides helper functions for status lookups

#### 2. Updated Status Map: `status-map.ts`
- **File**: `resources/js/lib/status-map.ts`
- **Changes**:
  - Now uses dynamic status labels from backend
  - Provides both async and sync versions
  - Sync version uses `status_label` from API response (recommended)

## Usage

### Recommended Approach (Using status_label from API)

Since `SurveyOrderResource` now includes `status_label`, components should use it directly:

```typescript
// In component
const statusInfo = getStatusInfoSync(survey.status, survey.status_label);
// or simply use survey.status_label directly if you just need the label
```

### Alternative Approach (Fetching Definitions)

If you need to fetch status definitions:

```typescript
import { fetchStatusDefinitions, getStatusLabel } from '@/lib/status-service';

// Fetch all definitions
const definitions = await fetchStatusDefinitions();

// Get label for a status value
const label = await getStatusLabel(6); // Returns "Waiting Subscription"
```

## Migration Guide

### For Components Using Status

**Before:**
```typescript
const statusInfo = getStatusInfo(survey.status);
```

**After (Recommended):**
```typescript
// Use status_label from API response
const statusInfo = getStatusInfoSync(survey.status, survey.status_label);
```

**Or if status_label is not available:**
```typescript
// Async version (will fetch from API)
const statusInfo = await getStatusInfo(survey.status);
```

### For Components Rendering Status

Since API now includes `status_label`, you can simply use it:

```typescript
// Simple approach - just use the label from API
<span>{survey.status_label}</span>

// Or with badge styling
const statusInfo = getStatusInfoSync(survey.status, survey.status_label);
<Badge className={statusInfo.bg}>{statusInfo.label}</Badge>
```

## Benefits

1. **Single Source of Truth**: Backend enum controls all status labels
2. **No Hardcoding**: Frontend doesn't need to update when backend changes labels
3. **Type Safety**: Status values are still numeric (1-8) for consistency
4. **Backward Compatible**: Old code still works, but can be migrated gradually
5. **Performance**: Status definitions are cached after first fetch

## API Response Example

### Status Definitions Endpoint
```json
{
  "success": true,
  "data": {
    "statuses": [
      { "value": 1, "label": "Created", "name": "Created" },
      { "value": 2, "label": "Ready", "name": "Ready" },
      { "value": 6, "label": "Waiting Subscription", "name": "Waiting" },
      { "value": 8, "label": "Completed", "name": "Completed" }
    ],
    "status_map": {
      "1": "Created",
      "2": "Ready",
      "6": "Waiting Subscription",
      "8": "Completed"
    },
    "label_map": {
      "Created": 1,
      "Ready": 2,
      "Waiting Subscription": 6,
      "Completed": 8
    }
  }
}
```

### Survey Order Response (Updated)
```json
{
  "customer_survey_order_id": "20000455502954",
  "status": 6,
  "status_label": "Waiting Subscription",  // ← New field
  ...
}
```

## Testing

1. **Test Status Definitions Endpoint**:
   ```bash
   curl http://localhost/api/v1/status-definitions
   ```

2. **Verify Survey Order Response**:
   - Check that `status_label` field is present
   - Verify label matches backend enum

3. **Test Frontend**:
   - Verify status badges show correct labels
   - Test with different status values
   - Verify fallback for unknown statuses

## Future Improvements

1. **Add Status Metadata**: Include color, icon, description in API response
2. **Status Transitions**: Define valid status transitions
3. **Localization**: Support multiple languages for status labels
4. **Status Groups**: Group statuses by category (active, completed, failed, etc.)
