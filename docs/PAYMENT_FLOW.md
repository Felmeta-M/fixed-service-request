# Payment Flow Documentation

This document describes the Telebirr payment integration flow with bulletproof double payment protection.

---

## Overview

The payment system integrates with **Telebirr** (via Fabric API) to process payments for Fixed Services (Data, Voice, Combo). The flow includes multiple layers of protection to prevent double payments and protect customers.

---

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER INITIATES PAYMENT                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1️⃣  ACQUIRE CACHE LOCK                                                     │
│      Key: payment_lock:{order_id}                                           │
│      Duration: 10 seconds                                                   │
│                                                                             │
│      ❌ Lock Failed → "A payment request is already being processed"        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2️⃣  CHECK LOCAL DATABASE                                                   │
│      Payment::isPaid() → status === PAID && trans_id exists                 │
│                                                                             │
│      ✅ Already Paid → "Your payment has already been processed"            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3️⃣  GET FABRIC TOKEN                                                       │
│      - Check cache for existing token                                       │
│      - If expired/missing → request new token from Fabric API               │
│      - Cache token until expirationDate                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4️⃣  RECONCILIATION CHECK (if payment was previously initiated)            │
│      Condition: merch_order_id exists in payment record                     │
│                                                                             │
│      → Query Telebirr API: /payment/v1/merchant/queryOrder                  │
│      → Use EXISTING merch_order_id (not new)                                │
│                                                                             │
│      If Telebirr says "Completed" but DB says "Pending":                    │
│         → Auto-confirm payment in our system                                │
│         → Trigger service activation                                        │
│         → Return "Your payment has already been processed"                  │
│                                                                             │
│      This catches: webhook failures, network issues, race conditions        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5️⃣  CREATE PAYMENT INTENT                                                  │
│      → Generate new merch_order_id                                          │
│      → Update payment record with merch_order_id                            │
│      → Call Telebirr API: /payment/v1/merchant/preOrder                     │
│      → Receive prepay_id                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6️⃣  BUILD RAW REQUEST & REDIRECT                                           │
│      → Sign request with RSA                                                │
│      → Build H5 checkout URL                                                │
│      → Return URL to frontend                                               │
│      → Customer redirected to Telebirr payment page                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7️⃣  RELEASE LOCK                                                           │
│      Lock automatically released in finally block                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER COMPLETES PAYMENT                            │
│                           (on Telebirr H5 page)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          ▼                         ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────────┐
│  8️⃣a  WEBHOOK CALLBACK            │  │  8️⃣b  REDIRECT CALLBACK               │
│  POST /api/telebirr/notify       │  │  GET /payment/success                │
│                                  │  │                                      │
│  → Verify signature              │  │  → Show success page                 │
│  → Idempotency check (isPaid)    │  │  → Frontend polls for status         │
│  → Update payment status         │  │                                      │
│  → Update survey order status    │  │                                      │
│  → Trigger service activation    │  │                                      │
└──────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## Protection Layers

### 1. Cache Lock (Concurrency Protection)

```php
$lock = Cache::lock("payment_lock:{$orderId}", 10);

if (!$lock->get()) {
    throw new RuntimeException('A payment request is already being processed.');
}
```

**Purpose**: Prevents race conditions when customer double-clicks or browser sends duplicate requests.

**Duration**: 10 seconds (enough for API round-trip).

---

### 2. Local Database Check

```php
if ($payment->isPaid()) {
    throw new RuntimeException('Your payment has already been processed.');
}
```

**Purpose**: Fast check against local database before any external API calls.

**Condition**: `status === PAID && trans_id exists`

---

### 3. Telebirr Reconciliation

```php
if ($this->isPaymentInitiated($orderId)) {
    $this->verifyAndReconcileTelebirrPayment($fabricToken, $payment);
}
```

**Purpose**: Catches edge cases where:
- Customer paid but webhook failed (network issue)
- Customer paid but closed browser before redirect
- Telebirr processed payment but our system didn't receive confirmation

**Action**: If Telebirr reports "Completed", automatically confirm in our system and trigger service activation.

---

### 4. Webhook Idempotency

```php
// In PaymentService::confirmPayment()
if ($payment->status === Payment::STATUS_PAID) {
    return; // Already processed, skip
}
```

**Purpose**: Telebirr may send duplicate webhooks. This ensures we only process once.

---

## Payment Statuses

| Status | Value | Description |
|--------|-------|-------------|
| `PENDING` | 0 | Payment created, awaiting customer action |
| `PAID` | 1 | Payment confirmed by Telebirr |
| `FAILED` | 2 | Payment failed or rejected |
| `CANCELLED` | 3 | Payment cancelled by customer or system |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/Services/CreateOrderService.php` | Main payment flow with protection logic |
| `app/Services/Payment/PaymentService.php` | Payment CRUD and confirmation |
| `app/Services/FabricTokenService.php` | Fabric API token management |
| `app/Services/TelebirrSignerService.php` | RSA signing for Telebirr requests |
| `app/Http/Controllers/Api/v1/TelebirrController.php` | Webhook handler |
| `app/Models/Payment.php` | Payment model with status constants |

---

## API Endpoints

### Create Payment Order

```
POST /api/v1/payment/create
```

**Request:**
```json
{
    "customerSurveyOrderId": "30151234567890"
}
```

**Response (Success):**
```json
{
    "success": true,
    "data": {
        "rawRequest": "https://h5pay.trade.pay.yayapay.et/..."
    }
}
```

**Response (Already Paid):**
```json
{
    "success": false,
    "message": "Your payment has already been processed. No further action is needed."
}
```

---

### Telebirr Webhook

```
POST /api/telebirr/notify
```

**Payload from Telebirr:**
```json
{
    "trade_status": "Completed",
    "transId": "TXN123456789",
    "total_amount": "100.00",
    "merch_order_id": "MO20260204123456",
    "payment_order_id": "PO789456123"
}
```

---

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| Lock acquisition failed | Concurrent request | "A payment request is already being processed. Please wait a moment and try again." |
| Already paid | Payment confirmed | "Your payment has already been processed. No further action is needed." |
| Fabric token failure | Telebirr API down | "Payment service temporarily unavailable. Please try again." |
| Create order failed | Telebirr rejected | "Create order request failed." |

---

## Logging

All payment events are logged to `storage/logs/payment/payment-YYYY-MM-DD.log`:

```
[2026-02-04 15:30:00] production.WARNING: Double payment attempt blocked - already paid {"order_id":"30151234567890","trans_id":"TXN123"}
[2026-02-04 15:30:05] production.WARNING: Payment completed on Telebirr but not in DB - reconciling {"order_id":"30151234567890"}
[2026-02-04 15:30:10] production.INFO: Telebirr order created successfully {"prepay_id":"PP456","order_id":"30151234567890"}
```

---

## Troubleshooting

### Customer says "I paid but order not updated"

1. Check payment log: `docker compose exec app cat /var/www/storage/logs/payment/payment-$(date +%F).log | grep {order_id}`

2. Check payment status in DB:
   ```sql
   SELECT * FROM payments WHERE customer_survey_order_id = '{order_id}';
   ```

3. If `status = 0` (pending) but customer paid:
   - The reconciliation will auto-fix on next payment attempt
   - Or manually trigger: Query Telebirr API with `merch_order_id`

### Duplicate payment attempts blocked

This is expected behavior. Check logs for:
```
Payment request blocked - another request in progress
```

Customer should wait a few seconds and try again.

---

## Testing Double Payment Protection

1. **Test concurrent requests**: Open two browser tabs, click "Pay" simultaneously → Second should be blocked

2. **Test already paid**: Complete a payment, then try to pay again → Should show "already processed"

3. **Test reconciliation**: 
   - Create payment intent
   - Manually set payment to "Completed" in Telebirr sandbox
   - Don't trigger webhook
   - Try to pay again → Should auto-reconcile and show "already processed"
