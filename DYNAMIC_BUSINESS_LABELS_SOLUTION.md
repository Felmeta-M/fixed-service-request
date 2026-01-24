# Dynamic Business Labels Solution

## Problem
The `getStatusLabel()` method in `SurveyOrderController` had hardcoded business-specific labels like:
- "Order Completed" 
- "Survey Completed"
- "Device Selection"
- "Waiting Survey"
- etc.

If these labels needed to change (e.g., "Order Completed" → "Service Activation"), the frontend would break because it expects specific hardcoded strings.

## Solution
Moved all business-specific label logic to the `FFDServiceProvisionStatus` enum, making it the **single source of truth** for all status labels (both base and business-specific).

### Changes Made

#### 1. Added `businessLabel()` Method to Enum
**File**: `app/Enums/FFDServiceProvisionStatus.php`

- Centralizes all business-specific label logic
- Takes context (has_subscription, is_manual, device_selected, etc.) as parameters
- Returns appropriate label based on context
- **Easy to change**: Just update the enum method to change "Order Completed" to "Service Activation"

#### 2. Added `possibleBusinessLabels()` Method
**File**: `app/Enums/FFDServiceProvisionStatus.php`

- Returns all possible label variations for a status
- Helps frontend know all possible labels it might encounter
- Useful for validation and UI components

#### 3. Updated `getStatusLabel()` Method
**File**: `app/Http/Controllers/Api/v1/SurveyOrderController.php`

- Now uses `$statusEnum->businessLabel($context)` instead of hardcoded strings
- Much simpler and cleaner code
- Automatically uses latest labels from enum

#### 4. Updated Status API Endpoint
**File**: `app/Http/Controllers/Api/v1/StatusController.php`

- Now includes `business_labels` in response
- Frontend can fetch all possible business label variations
- Helps frontend handle dynamic labels

## How to Change Labels

### Example: Change "Order Completed" to "Service Activation"

**Before** (hardcoded in controller):
```php
// Had to change in multiple places
$hasSubscription => 'Order Completed',
```

**After** (centralized in enum):
```php
// Just change once in the enum
self::Completed => match (true) {
    $hasSubscription => 'Service Activation', // ← Change here
    // ...
}
```

**Result**: 
- ✅ Frontend automatically gets new label via API
- ✅ No frontend code changes needed
- ✅ Single source of truth
- ✅ Type-safe and exhaustive

## API Response Example

### Status Definitions Endpoint
```json
{
  "success": true,
  "data": {
    "statuses": [
      { "value": 8, "label": "Completed", "name": "Completed" }
    ],
    "business_labels": {
      "8": [
        "Completed",
        "Order Completed",  // Can be changed to "Service Activation"
        "Survey Completed",
        "Device Selection",
        "Pending Payment",
        "Paid",
        "Ready"
      ]
    }
  }
}
```

### Survey Order Response
```json
{
  "status": 8,
  "status_label": "Order Completed"  // Or "Service Activation" if changed
}
```

## Benefits

1. **Single Source of Truth**: All labels in one place (enum)
2. **Easy to Change**: Update enum, frontend automatically gets new labels
3. **Type Safe**: Exhaustive match ensures all cases handled
4. **Frontend Resilient**: Frontend can fetch all possible labels and handle dynamically
5. **Maintainable**: Clear separation of concerns
6. **Backward Compatible**: Existing code still works

## Frontend Usage

Frontend can now:
1. Fetch all possible business labels from `/api/v1/status-definitions`
2. Use `status_label` from API response (already included)
3. Handle label changes without code updates
4. Validate labels against known possible values

## Migration Notes

- ✅ No breaking changes
- ✅ Existing API responses still work
- ✅ Frontend can gradually migrate to use `status_label` from API
- ✅ Old hardcoded labels in frontend will still work until migrated

## Future Improvements

1. **Configuration File**: Move business labels to config file for non-developers
2. **Localization**: Support multiple languages for business labels
3. **Label Metadata**: Add descriptions, icons, colors to business labels
4. **Label History**: Track label changes over time
