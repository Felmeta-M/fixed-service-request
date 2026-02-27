# Trouble Ticket (TT) Status Documentation

This document describes how trouble ticket statuses are derived from the third-party API and used across the application.

---

## Overview

The TT status is resolved from two API fields: **currentActivity** and **ttStatus**. The application normalizes these into three internal statuses: `open`, `confirm`, and `closed`.

**Related code:**
- `App\Enums\TicketStatus` — mapping logic
- `App\Services\QueryTTService` — parses API response, calls `TicketStatus::fromApiResponse()`
- `App\Jobs\QueryTTJob` — syncs status from third-party to local DB
- `App\Http\Controllers\Api\v1\TroubleTicketController` — batch refresh on index

---

## Status Mapping

| Internal Status | Display Label           | currentActivity             | ttStatus                | Description                                  |
|----------------|-------------------------|-----------------------------|-------------------------|----------------------------------------------|
| **open**       | Under Processing        | Customer Complaint Handling | WAITING FOR CHECK-IN    | Open TT, awaiting check-in                   |
| **open**       | Under Processing        | Customer Complaint Handling | CHECK-OUT               | Open TT, check-out                           |
| **confirm**    | Waiting for Confirmation| Customer Complaint Confirm  | WAITING FOR CHECK-IN    | Waiting for customer confirmation            |
| **closed**     | Closed                  | *(empty)*                   | *(empty)*               | Archived/closed                              |
| **closed**     | Closed                  | Customer Complaint Handling | Cancelled               | Cancelled                                    |
| **closed**     | Closed                  | Customer Complaint Confirm  | Cancelled               | Cancelled                                    |

---

## Scenarios

### Open TTs

```
currentActivity: "Customer Complaint Handling"
ttStatus:        "WAITING FOR CHECK-IN"  OR  "CHECK-OUT"
→ status: open (Under Processing)
```

### Under Confirmation TTs

Waiting for customer confirmation:

```
currentActivity: "Customer Complaint Confirm"
ttStatus:        "WAITING FOR CHECK-IN"
→ status: confirm (Waiting for Confirmation)
```

### Archived / Closed TTs

```
# Both empty (normally archived)
currentActivity: ""
ttStatus:        ""
→ status: closed

# Cancelled (both spellings supported)
currentActivity: "Customer Complaint Handling"  OR  "Customer Complaint Confirm"
ttStatus:        "Cancelled"  OR  "Canceled"
→ status: closed
```

---

## Active vs Completed

| Category    | Statuses                | Usage                                        |
|-------------|-------------------------|----------------------------------------------|
| **Active**  | `open`, `confirm`       | Tickets still being worked on; eligible for refresh |
| **Completed** | `closed`              | Archived; no further sync needed             |

---

## Third-Party Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Third-party API (queryTT)                                               │
│  Returns: currentActivity, ttStatus (raw)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  QueryTTService::parseQueryTTResponseXml()                               │
│  Calls TicketStatus::fromApiResponse(currentActivity, ttStatus)          │
│  Adds resolved 'status' to each tt in tt_list                            │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
┌───────────────────────────────┐   ┌─────────────────────────────────────┐
│  QueryTTJob (async)            │   │  TroubleTicketController::index()   │
│  Uses tt['status'] for update  │   │  batchRefreshTickets() uses         │
│  Updates ticket in DB          │   │  fromApiResponse() for each ticket  │
└───────────────────────────────┘   └─────────────────────────────────────┘
```

---

## Notes

- **Cancelled vs Canceled**: Both spellings are supported (API may use either).
- **Default**: Unknown combinations with non-empty values default to `open`.
- **Empty values**: Both empty `currentActivity` and `ttStatus` map to `closed` (archived).
