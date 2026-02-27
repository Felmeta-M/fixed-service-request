# Telebirr Integration: Training Material for Students

**Target audience:** Software engineering students learning payment gateway integration  
**Prerequisites:** PHP/Laravel basics, REST APIs, HTTP, basic cryptography concepts  
**Estimated study time:** 4–6 hours  

---

## Table of Contents

1. [Learning Objectives](#1-learning-objectives)
2. [Module 1: Concepts & Architecture](#2-module-1-concepts--architecture)
3. [Module 2: Integration Patterns & Mechanisms](#3-module-2-integration-patterns--mechanisms)
4. [Module 3: Key Techniques Explained](#4-module-3-key-techniques-explained)
5. [Module 4: Security Mechanisms](#5-module-4-security-mechanisms)
6. [Module 5: Reliability & Failure Handling](#6-module-5-reliability--failure-handling)
7. [Cumulative Exercises & Self-Check](#7-cumulative-exercises--self-check)
8. [Quick Reference](#8-quick-reference)

---

## 1. Learning Objectives

By the end of this training, you will be able to:

| # | Objective |
|---|-----------|
| 1 | Explain the role of a payment gateway and the difference between synchronous and asynchronous payment flows |
| 2 | Describe the request–response vs webhook communication patterns |
| 3 | Implement API authentication using bearer tokens and app secrets |
| 4 | Apply RSA signing for request integrity and authenticity |
| 5 | Use distributed locks to prevent race conditions in payment flows |
| 6 | Implement idempotent webhook handlers |
| 7 | Use reconciliation to handle webhook delivery failures |
| 8 | Trace the end-to-end flow from user click to payment confirmation |

---

## 2. Module 1: Concepts & Architecture

### 2.1 What is a Payment Gateway?

A **payment gateway** is a service that:

- Accepts payment requests from merchants (our app)
- Presents a secure payment UI to the customer
- Processes the actual money transfer
- Notifies the merchant of the result

**Key idea:** The merchant app never handles card numbers or mobile money credentials. The gateway (Telebirr) does.

---

### 2.2 Synchronous vs Asynchronous Payment

| Pattern | How it works | When to use |
|---------|--------------|-------------|
| **Synchronous** | Customer pays on our page; we wait for a response in the same request | Simple flows, trusted clients |
| **Asynchronous** | Customer is redirected to gateway page; gateway calls us back later (webhook) | Typical for mobile money, bank redirects |

**Telebirr uses the asynchronous pattern:**

1. We create an order and get a URL.
2. Customer goes to Telebirr’s page and pays.
3. Telebirr sends a **webhook** (callback) to our server with the result.

---

### 2.3 Communication Directions

```
┌─────────────────┐                    ┌─────────────────┐
│   Our App       │   ── outbound ──►  │   Telebirr      │
│   (Merchant)    │   REST API calls   │   (Gateway)     │
│                 │   - get token      │                 │
│                 │   - create order   │                 │
│                 │   - query order    │                 │
│                 │   ◄── inbound ──   │                 │
│                 │   Webhook POST     │                 │
└─────────────────┘                    └─────────────────┘
```

- **Outbound:** Our app calls Telebirr’s API (we initiate).
- **Inbound:** Telebirr calls our webhook (Telebirr initiates).

---

### 2.4 High-Level Flow Diagram

```
CUSTOMER              OUR APP                    TELEBIRR
   │                     │                          │
   │  1. Click Pay       │                          │
   │────────────────────►│                          │
   │                     │  2. POST /token          │
   │                     │─────────────────────────►│
   │                     │◄─────────────────────────│  token
   │                     │  3. POST /preOrder       │
   │                     │─────────────────────────►│
   │                     │◄─────────────────────────│  prepay_id
   │                     │                          │
   │  4. Redirect URL    │                          │
   │◄────────────────────│                          │
   │                     │                          │
   │  5. Pay on Telebirr page                       │
   │───────────────────────────────────────────────►│
   │                     │  6. POST /notify         │
   │                     │◄─────────────────────────│
   │                     │  7. Confirm, activate    │
   │  8. Success page    │                          │
   │◄────────────────────│                          │
```

---

### 2.5 Concept Check

**Q1.** Why does our app not process payment directly on our own page?  
**Q2.** What is the main difference between a REST API call and a webhook?  
**Q3.** Why must the webhook URL be publicly reachable (HTTPS)?

### 2.6 Exercises

| # | Exercise | Type |
|---|----------|------|
| 1 | **Draw the flow:** On paper or a whiteboard, draw the sequence of messages between Customer, Our App, and Telebirr from “Pay” click to payment confirmation. Label each arrow with the HTTP method and endpoint (or event). | Diagram |
| 2 | **Compare patterns:** Fill in a table: For a hypothetical *synchronous* Telebirr (customer pays on our page), list 2 advantages and 2 disadvantages compared to the current asynchronous redirect flow. | Comparison |
| 3 | **Identify direction:** For each action below, say whether it is *outbound* (we call Telebirr) or *inbound* (Telebirr calls us): (a) Get token, (b) Create order, (c) Receive payment result, (d) Query order status. | Classification |

---

## 3. Module 2: Integration Patterns & Mechanisms

### 3.1 Pattern: Token-Based API Authentication

**Concept:** Before calling Telebirr’s payment APIs, we must obtain an **access token**. This is similar to OAuth: prove identity once, use the token for subsequent calls.

**Mechanism in code:**

```php
// FabricTokenService.php
$response = Http::withHeaders([
    'Content-Type' => 'application/json',
    'X-APP-Key'    => $this->fabricAppId,  // Identifies our app
])
->post("{$this->baseUrl}/payment/v1/token", [
    'appSecret' => $this->appSecret,        // Proves we're the real app
]);
```

**Technique: Caching the token**

Token requests cost a network round-trip. We cache the token until it expires:

```php
// CreateOrderService.php
$fabricToken = Cache::get('fabricToken');
if (!$fabricToken) {
    $fabricToken = $tokenService->applyFabricToken();
    Cache::put('fabricToken', $fabricToken, $expirationDate);
}
```

**Why this matters:** Reduces latency and load on the token endpoint.

---

### 3.2 Pattern: Webhook (Callback) Handling

**Concept:** A **webhook** is an HTTP POST that an external system sends to our URL when an event occurs (e.g. payment completed). We must:

1. Accept the POST
2. Find the related record (e.g. payment)
3. Update our state
4. Always return `200 OK` quickly (or the provider may retry)

**Mechanism in code:**

```php
// TelebirrController.php - notify()
public function notify(Request $request)
{
    $data = $request->validate([...]);

    $payment = Payment::where('merch_order_id', $data['merch_order_id'])->first();

    if (!$payment) {
        Log::error('Telebirr Callback: Payment Not Found', $data);
        return response()->json(['success' => true]);  // ⚠️ Still 200!
    }

    $this->paymentService->confirmPayment($payment, $data);

    return response()->json(['success' => true]);  // Always 200
}
```

**Key rule:** Return `200` even when we can’t process (e.g. payment not found). Otherwise Telebirr may retry repeatedly.

---

### 3.3 Pattern: Redirect-Based Checkout

**Concept:** We don’t host the payment form. We build a **signed URL** that Telebirr recognizes, and redirect the customer there.

**Mechanism:** Build a query string with `appid`, `merch_code`, `prepay_id`, etc., sign it with RSA, and append to the H5 base URL.

```php
// CreateOrderService.php - createRawRequest()
$rawRequest = $this->webBaseUrl . $queryString . "&sign=" . $signature . "&version=1.0&trade_type=Checkout";
```

The frontend then does:

```javascript
window.location.href = result.rawRequest;  // Full page redirect
```

---

### 3.4 Concept Check

**Q4.** Why do we cache the Fabric token instead of requesting it on every payment?  
**Q5.** Why should a webhook handler return `200` even when it cannot find the payment?  
**Q6.** What role does `prepay_id` play in the checkout flow?

### 3.5 Exercises

| # | Exercise | Type |
|---|----------|------|
| 1 | **Token flow:** Trace the token lifecycle. When is it fetched? When is it cached? When is it evicted? Write a short sequence (e.g. “Request 1: cache miss → fetch → cache. Request 2: cache hit → use.”). | Trace |
| 2 | **Webhook response:** You receive a webhook with `merch_order_id = "UNKNOWN123"`. Our DB has no payment with that ID. (a) What should you return? (b) Why? (c) What should you log? | Scenario |
| 3 | **Redirect URL:** List the query parameters that must be in the `rawRequest` URL for Telebirr’s H5 page to work. Which one is signed, and why? | Identification |

---

## 4. Module 3: Key Techniques Explained

### 4.1 Technique: Distributed Lock (Cache Lock)

**Problem:** Two browser tabs or rapid double-clicks can trigger two “create order” requests at the same time. Without protection, we might create duplicate payment intents or race conditions.

**Solution:** Use a **distributed lock** (e.g. Redis-based) so only one request at a time can run the critical section for that order.

**Code:**

```php
$lockKey = "payment_lock:{$orderId}";
$lock = Cache::lock($lockKey, 10);  // 10 second TTL

if (!$lock->get()) {
    throw new RuntimeException('A payment request is already being processed.');
}

try {
    // Critical section: check DB, call Telebirr, etc.
} finally {
    $lock->release();  // Always release, even on exception
}
```

**Key points:**

- Lock key must be unique per order (e.g. `payment_lock:30151234567890`).
- TTL (10 seconds) prevents permanent lock if the process crashes.
- `finally` ensures the lock is released even when an exception is thrown.

---

### 4.2 Technique: Idempotency

**Concept:** An operation is **idempotent** if performing it multiple times has the same effect as performing it once. Example: `UPDATE payments SET status = 1 WHERE id = 5` – running it twice is safe.

**Application:** Webhooks may be sent more than once. We must not double-confirm a payment.

**Code:**

```php
// PaymentService.php - confirmPayment()
public function confirmPayment(Payment $payment, array $providerPayload): void
{
    if ($payment->status === Payment::STATUS_PAID) {
        return;  // Already done – skip (idempotent)
    }
    // ... update payment, activate service ...
}
```

**Pattern:** Check “already processed?” at the start; if yes, return without side effects.

---

### 4.3 Technique: Reconciliation

**Problem:** The customer paid on Telebirr, but our webhook was never received (network issue, server down, etc.). Our DB still shows “pending.”

**Solution:** **Reconciliation** – when the customer tries to pay again, we first **query Telebirr** for the status of the existing order. If Telebirr says “PAY_SUCCESS,” we confirm it locally.

**Flow:**

```
Customer clicks Pay again
    │
    ▼
Do we have merch_order_id for this payment?  ──No──► Create new order as usual
    │
   Yes
    │
    ▼
Call Telebirr: queryOrder(merch_order_id)
    │
    ▼
Telebirr returns order_status = "PAY_SUCCESS"?
    │
   Yes ──► Confirm payment in our DB, activate service, return "already processed"
   No  ──► Proceed to create new order
```

**Code (simplified):**

```php
if ($this->isPaymentInitiated($orderId)) {
    $this->verifyAndReconcileTelebirrPayment($fabricToken, $payment);
    $payment->refresh();
    if ($payment->isPaid()) {
        throw new RuntimeException('Your payment has already been processed.');
    }
}
```

**Throttling:** We throttle reconciliation to at most once per 5 minutes per payment (using `last_checked_at`) to avoid excessive API calls.

---

### 4.4 Technique: Layered Double-Payment Protection

We use **multiple layers** so that if one fails, another can still prevent double payment:

| Layer | Mechanism | Catches |
|-------|-----------|---------|
| 1. Lock | Cache lock for 10 seconds | Concurrent requests (double-click) |
| 2. DB check | `Payment::isPaid()` | Already-paid orders |
| 3. Reconciliation | Query Telebirr before creating new order | Missed webhook |
| 4. Idempotency | Skip if `status === PAID` in `confirmPayment` | Duplicate webhooks |

---

### 4.5 Concept Check

**Q7.** What happens if we forget to release the lock in the `finally` block?  
**Q8.** Why is reconciliation throttled (e.g. once per 5 minutes)?  
**Q9.** Give an example of a scenario where reconciliation would fix a “I paid but order not updated” issue.

### 4.6 Exercises

| # | Exercise | Type |
|---|----------|------|
| 1 | **Lock pseudocode:** Write pseudocode for a function that uses a lock to protect a critical section. Include: acquire lock, check if acquired, try/finally, release. What happens if you omit the `finally`? | Code |
| 2 | **Idempotency check:** For `confirmPayment`, list three scenarios where the webhook could be called more than once for the same payment. In each case, what should the code do? | Scenario |
| 3 | **Reconciliation path:** A customer paid 10 minutes ago. Our webhook never arrived. They click “Pay” again. Trace the code path: which functions run, and in what order? When does reconciliation occur? | Trace |
| 4 | **Layer fallback:** If the cache lock fails (e.g. Redis is down), which of the other three layers can still prevent double payment? Explain. | Analysis |

---

## 5. Module 4: Security Mechanisms

### 5.1 RSA Request Signing

**Concept:** Telebirr needs to verify that requests really come from us and have not been altered. We sign the request body with our **private key**; Telebirr verifies with our **public key**.

**Steps:**

1. Build a canonical string from the request (sorted key=value pairs, excluding `sign` and `sign_type`).
2. Sign that string with RSA-SHA256 using our private key.
3. Encode the signature as Base64 and send it in the `sign` field.

**Code (TelebirrSignerService):**

```php
public function sign(array $request): string
{
    $string = $this->buildString($request);      // 1. Canonical string
    $sortedString = $this->sortedString($string); // 2. Sort segments (if required)
    return $this->signWithRSA($sortedString);     // 3. RSA sign, Base64 encode
}
```

**Excluded fields:** `sign`, `sign_type`, and similar fields must not be part of the signed string (otherwise verification would fail).

---

### 5.2 Canonical String Construction

**Requirement:** Both parties must build the exact same string from the request. Common approach:

- Sort keys alphabetically
- Format: `key1=value1&key2=value2&...`
- Exclude metadata fields (sign, sign_type)
- Flatten nested structures (e.g. `biz_content`) into key-value pairs

**Code (simplified):**

```php
$sorted = collect($request)
    ->sortKeys()
    ->reject(fn($value, $key) => in_array($key, $this->excludeFields))
    ->flatMap(/* flatten biz_content */);

return $sorted->map(fn($v, $k) => "{$k}={$v}")->values()->implode('&');
```

---

### 5.3 Secure Storage of Secrets

- **App secret** and **private key** must not be committed to version control.
- Use `.env` and `storage/app/keys/private.pem` (added to `.gitignore`).
- In production, consider a secrets manager.

---

### 5.4 Concept Check

**Q10.** Why must `sign` be excluded when building the string to sign?  
**Q11.** What could go wrong if we used different key sorting on our side vs Telebirr’s expectation?

### 5.5 Exercises

| # | Exercise | Type |
|---|----------|------|
| 1 | **Canonical string:** Given `{ "appid": "A1", "merch_code": "M1", "sign": "xyz", "sign_type": "RSA" }`, write the exact string that should be signed (exclude `sign` and `sign_type`). Format: `key=value&key=value`. | Calculation |
| 2 | **Signing steps:** In order, list the 4 steps from “raw request array” to “signed request ready to send.” What is the role of Base64? | Sequencing |
| 3 | **Security audit:** Create a checklist of 5 things to verify before deploying a payment integration (e.g. “Private key not in git”). | Checklist |
| 4 | **Flatten biz_content:** For `biz_content = { "merch_order_id": "123", "total_amount": "100.00" }`, show how it is flattened into the canonical string (as key=value pairs). | Code / Structure |

---

## 6. Module 5: Reliability & Failure Handling

### 6.1 Webhook Reliability

- Webhooks can fail (network, our server down, timeout).
- Providers often retry on non-2xx responses.
- **Design for retries:** Make the handler idempotent and return 200 quickly.

---

### 6.2 Database Transactions

Payment confirmation updates multiple tables (payment, survey order). We wrap them in a transaction:

```php
DB::transaction(function () use ($payment, $providerPayload, $isCompleted) {
    $payment->update([...]);
    SurveyOrder::where(...)->update([...]);
});
```

If anything fails, the whole update rolls back.

---

### 6.3 Side Effects After Commit

Heavy or external operations (e.g. service activation, stock deduction) run **after** the transaction commits:

```php
DB::transaction(function () { ... });

if ($isCompleted) {
    $this->deductDeviceStock(...);
    $this->activationService->activate(...);
}
```

This keeps the transaction short and avoids performing external calls inside the transaction.

---

### 6.4 Logging

We log important events for debugging:

- Payment initiated, order created, webhook received
- Reconciliation triggered, errors

All payment logs go to `storage/logs/payment/payment-YYYY-MM-DD.log`.

---

### 6.5 Concept Check

**Q12.** Why do we run service activation *after* the DB transaction commits?  
**Q13.** What could happen if the webhook handler took 30 seconds to respond?

### 6.6 Exercises

| # | Exercise | Type |
|---|----------|------|
| 1 | **Transaction boundary:** In `confirmPayment`, which operations run *inside* the transaction and which run *after*? Why is service activation outside? | Analysis |
| 2 | **Failure mapping:** For each failure: (a) Webhook times out, (b) DB connection fails mid-transaction, (c) Activation API fails. What happens? Is data consistent? | Scenario |
| 3 | **Logging design:** For a “payment confirmed” event, list 4 pieces of information you would log (e.g. order_id, trans_id). Why is each useful for debugging? | Design |
| 4 | **Retry behavior:** If our webhook returns 500, Telebirr may retry. What property must our handler have so that a retry is safe? How do we achieve it? | Reasoning |

---

## 7. Cumulative Exercises & Self-Check

*These exercises span multiple modules.*

### Exercise 1: End-to-End Trace

List the sequence of HTTP requests (method, URL, direction) from the moment the user clicks “Pay” until the payment is confirmed in our DB. Include both outbound (App → Telebirr) and inbound (Telebirr → App) calls.

### Exercise 2: Scenario Analysis

**Scenario:** Customer pays on Telebirr. Our webhook endpoint is down for 2 minutes. Telebirr retries 3 times, all fail. Our server comes back up.

- What is the payment status in our DB?
- What happens when the customer clicks “Pay” again?
- Which mechanism fixes this?

### Exercise 3: Code Reading

Find `TelebirrSignerService::buildString()` in the codebase and explain how nested `biz_content` is flattened for signing. Draw a small example with a nested object.

### Exercise 4: Design Question

If Telebirr did not support `queryOrder`, how would you design a fallback for missed webhooks? Consider: manual reconciliation, scheduled jobs, customer support flows, or other options. List pros and cons of each.

### Self-Check Answers (Brief)

1. **Q1.** Security, compliance, and liability; gateway handles sensitive data.  
2. **Q2.** REST: we call them; Webhook: they call us when an event occurs.  
3. **Q3.** Telebirr’s servers must reach our URL from the internet.  
4. **Q4.** To reduce latency and avoid extra token requests.  
5. **Q5.** To stop Telebirr from retrying; we log and handle internally.  
6. **Q6.** It identifies the payment session on Telebirr’s H5 page.  
7. **Q7.** The lock would block other requests until TTL expires.  
8. **Q8.** To limit API calls and avoid rate limiting.  
9. **Q9.** Customer paid, webhook failed → next “Pay” triggers reconciliation → we query Telebirr → confirm locally.  
10. **Q10.** The signature is computed over the rest of the payload; including `sign` would be circular.  
11. **Q11.** Signature would not match; requests would be rejected.  
12. **Q12.** To keep the transaction short and avoid external calls inside the transaction.  
13. **Q13.** Telebirr might timeout and retry; we’d need idempotency to handle duplicates.

---

## 8. Quick Reference

### Key Files

| File | Responsibility |
|------|----------------|
| `TelebirrController.php` | HTTP entry points: create-order, notify webhook |
| `CreateOrderService.php` | Core flow: lock, checks, token, reconciliation, preOrder, rawRequest |
| `FabricTokenService.php` | Obtain and return Fabric token |
| `TelebirrSignerService.php` | RSA signing of requests |
| `PaymentService.php` | Payment CRUD and idempotent confirmation |
| `TelebirrHelper.php` | Utilities: merchant order ID, nonce, timestamp |

### Telebirr API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /payment/v1/token` | Get Fabric token |
| `POST /payment/v1/merchant/preOrder` | Create order, get prepay_id |
| `POST /payment/v1/merchant/queryOrder` | Query order status |

### Our Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/create-order` | Create payment order, return H5 URL |
| `POST /telebirr/notify` | Webhook for payment result |
| `GET /payment/success` | Success page after redirect |

### Techniques Summary

| Technique | Problem | Solution |
|-----------|---------|----------|
| Cache lock | Concurrent payment requests | Lock per order for 10 seconds |
| Idempotency | Duplicate webhooks | Skip if already PAID |
| Reconciliation | Missed webhook | Query Telebirr before creating new order |
| Token caching | Repeated token calls | Cache until expiry |
| RSA signing | Request tampering/impersonation | Sign with private key |
| Transaction | Partial updates on failure | Wrap updates in DB transaction |
| Deferred side effects | Long transactions | Run activation after commit |

---

## Related Documentation

- [TELEBIRR_INTEGRATION.md](TELEBIRR_INTEGRATION.md) – Technical reference
- [PAYMENT_FLOW.md](PAYMENT_FLOW.md) – Flow and protection logic
- [HOST_NGINX_SETUP.md](HOST_NGINX_SETUP.md) – HTTPS and webhook reachability
