# App ↔ Telebirr Communication: Complete Documentation

This document explains how the Fixed Service Request app communicates with Telebirr, from simple overview to detailed code-level mechanics.

---

## Table of Contents

1. [Simple Overview](#1-simple-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Configuration](#3-configuration)
4. [Flow: Step-by-Step](#4-flow-step-by-step)
5. [Code Walkthrough (Component by Component)](#5-code-walkthrough-component-by-component)
6. [Telebirr API Endpoints Used](#6-telebirr-api-endpoints-used)
7. [App API Endpoints](#7-app-api-endpoints)
8. [Security & Signing](#8-security--signing)
9. [Protection Layers (Double Payment Prevention)](#9-protection-layers-double-payment-prevention)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Simple Overview

**What happens in plain English:**

1. **Customer clicks "Pay"** on a survey order in the app.
2. **App asks Telebirr** for a payment page URL (via Fabric API).
3. **Telebirr returns** a signed URL.
4. **App redirects** the customer to that Telebirr H5 payment page.
5. **Customer pays** using Telebirr (mobile money) on that page.
6. **Telebirr notifies our app** via webhook (`POST /telebirr/notify`) with payment result.
7. **App updates** the order and activates the service.

**Direction of communication:**

- **App → Telebirr:** Create order, query order status (REST API calls)
- **Telebirr → App:** Payment callback (webhook POST to our server)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CUSTOMER BROWSER                                     │
│  [Pay button] → POST /api/v1/create-order → Receives rawRequest URL              │
│  Redirects to: rawRequest (Telebirr H5 page)                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
           │                                                    ▲
           │ ① create-order                                     │ ⑥ redirect back
           ▼                                                    │   GET /payment/success
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FIXED SERVICE REQUEST APP                               │
│                                                                                   │
│  TelebirrController → CreateOrderService → Fabric API (HTTP)                      │
│                              ↓                                                    │
│  TelebirrController.notify() ← POST /telebirr/notify (webhook from Telebirr)     │
└─────────────────────────────────────────────────────────────────────────────────┘
           │                                                    ▲
           │ ② POST /payment/v1/token (get Fabric token)        │ ⑤ POST /telebirr/notify
           │ ③ POST /payment/v1/merchant/preOrder (create)      │    (Telebirr → App)
           │ ④ GET  (redirect customer to H5 URL)               │
           ▼                                                    │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TELEBIRR / FABRIC API                                   │
│  - Base URL: TELEBIRR_BASE_URL (e.g. https://developerportal.ethiotelebirr.et)   │
│  - Web URL:  WEB_TELEBIRR_BASE_URL (H5 checkout page)                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Configuration

All Telebirr settings come from environment variables, exposed via `config/services.php` and `config/telebirr.php`.

### `config/services.php`

```php
'telebirr' => [
    'base_url'       => env('TELEBIRR_BASE_URL'),       // Fabric API base (e.g. https://developerportal.ethiotelebirr.et:38443)
    'web_base_url'   => env('WEB_TELEBIRR_BASE_URL'),   // H5 checkout page base URL
    'fabric_app_id'  => env('TELEBIRR_APP_ID'),         // X-APP-Key header
    'app_secret'     => env('TELEBIRR_APP_SECRET'),     // Used for token request
    'merchant_app_id'=> env('TELEBIRR_MERCHANT_APP_ID'),// Merchant app ID in biz_content
    'merchant_code'  => env('TELEBIRR_MERCHANT_CODE'),  // Merchant code in biz_content
    'private_key'    => env('TELEBIRR_PRIVATE_KEY'),    // Path or content for RSA signing
    'notify_url'     => env('NOTIFY_URL'),              // Fallback notify URL
],
```

### `config/telebirr.php`

```php
return [
    'private_key_path' => storage_path('app/keys/private.pem'),
    'public_key_path'  => storage_path('keys/public.pem'),
    'exclude_fields'   => ['sign', 'sign_type', 'header', 'refund_info', 'openType', 'raw_request'],
];
```

**`exclude_fields`** are omitted when building the string to be RSA-signed (the `sign` field itself must not be part of the signed content).

---

## 4. Flow: Step-by-Step

### Phase A: Customer Initiates Payment

| Step | Actor | Action |
|------|-------|--------|
| 1 | Frontend | User clicks Pay → `useCreatePaymentOrder()` sends `POST /api/v1/create-order` with `{ customerSurveyOrderId }` |
| 2 | `TelebirrController::createOrder` | Validates `customerSurveyOrderId`, checks `SurveyOrder::canPay()` |
| 3 | `CreateOrderService::createOrder` | Acquires lock, checks DB, gets Fabric token, optionally reconciles, creates order with Telebirr |
| 4 | `CreateOrderService` | Returns `rawRequest` (signed H5 URL) |
| 5 | Frontend | Redirects to `rawRequest` → Telebirr H5 payment page |

### Phase B: Customer Pays on Telebirr

| Step | Actor | Action |
|------|-------|--------|
| 6 | Customer | Completes payment on Telebirr H5 page |
| 7 | Telebirr | Sends `POST /telebirr/notify` to our app with payment result |
| 8 | `TelebirrController::notify` | Finds `Payment` by `merch_order_id`, calls `PaymentService::confirmPayment` |
| 9 | App | Updates payment, survey order status, deducts device stock, triggers service activation |
| 10 | Customer | May be redirected to `GET /payment/success` by Telebirr |

---

## 5. Code Walkthrough (Component by Component)

### 5.1 Frontend: Initiate Payment

**File:** `resources/js/hooks/use-api-mutations.ts`

```typescript
export function useCreatePaymentOrder() {
    const token = useAuthToken();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { customerSurveyOrderId: string; customerCode: string | number; amount: number }) => {
            if (!token) throw new Error('Authentication token required');
            const response = await apiClient.post<any>('/create-order', data, { token });
            if (!response.success) {
                throw new Error(response.message || 'Failed to create payment order');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyDetail'] });
            queryClient.invalidateQueries({ queryKey: ['surveyList'] });
        },
    });
}
```

- Sends `POST /api/v1/create-order` with auth token.
- Expects `{ success, rawRequest?, message? }`. On success, frontend uses `rawRequest` to redirect.

**File:** `resources/js/features/surveys/components/survey-detail.tsx` (and similar)

```tsx
if ((result as any).rawRequest) {
    window.location.href = (result as any).rawRequest;
}
```

- Redirects the browser to the Telebirr H5 page URL.

---

### 5.2 TelebirrController: HTTP Layer

**File:** `app/Http/Controllers/Api/v1/TelebirrController.php`

#### `createOrder()`

```php
public function createOrder(Request $request)
{
    try {
        $validated = $request->validate([
            'customerSurveyOrderId' => 'required|exists:survey_orders,customer_survey_order_id',
        ]);

        $surveyOrder = SurveyOrder::where('customer_survey_order_id', $validated['customerSurveyOrderId'])
            ->firstOrFail();

        if (!$surveyOrder->canPay()) {
            return response()->json([
                'success' => false,
                'message' => 'Your payment has already been processed. No further action is needed.',
            ], 422);
        }

        $rawRequest = $this->createOrderService->createOrder($validated);

        return response()->json([
            'success' => true,
            'rawRequest' => $rawRequest,
        ]);
    } catch (RuntimeException $e) {
        Log::error('Telebirr Create Order Error', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Unable to create order',
        ], 500);
    }
}
```

- Validates `customerSurveyOrderId` against `survey_orders`.
- Ensures order can still be paid via `SurveyOrder::canPay()`.
- Delegates to `CreateOrderService::createOrder()` and returns `rawRequest` or error.

#### `notify()` – Webhook Handler

```php
public function notify(Request $request)
{
    $data = $request->validate([
        'merch_order_id' => 'nullable',
        'payment_order_id' => 'nullable',
        'total_amount' => 'nullable',
        'transId' => 'nullable',
        'trade_status' => 'nullable',
        'sign' => 'nullable',
    ]);

    AppLogger::payment()->info('Telebirr Callback', ['data' => $data]);

    $payment = Payment::where('merch_order_id', $data['merch_order_id'])->first();

    if (!$payment) {
        Log::error('Telebirr Callback: Payment Not Found', $data);
        return response()->json(['success' => true]);  // Still 200 to avoid retries
    }

    $this->paymentService->confirmPayment($payment, $data);

    return response()->json(['success' => true]);
}
```

- Receives Telebirr webhook, finds payment by `merch_order_id`.
- Always returns `200` to prevent Telebirr from retrying on our side.
- Uses `PaymentService::confirmPayment()` for idempotent processing.

---

### 5.3 CreateOrderService: Core Payment Flow

**File:** `app/Services/CreateOrderService.php`

#### Token retrieval (cached)

```php
protected function getFabricToken(): string
{
    $fabricToken = Cache::get('fabricToken');

    if (!$fabricToken) {
        $tokenService = app(FabricTokenService::class);
        $fabricToken = $tokenService->applyFabricToken();

        $expirationDate = Carbon::createFromFormat('YmdHis', $fabricToken->expirationDate);
        Cache::put('fabricToken', $fabricToken, $expirationDate);
    }

    return is_object($fabricToken) ? $fabricToken->token : $fabricToken;
}
```

- Caches Fabric token to avoid repeated token requests.
- Uses `expirationDate` from token response for TTL.

#### Main flow: `createOrder()`

```php
public function createOrder(array $data): string
{
    $orderId = $data['customerSurveyOrderId'];
    $lockKey = "payment_lock:{$orderId}";

    // 1. Acquire lock
    $lock = Cache::lock($lockKey, 10);
    if (!$lock->get()) {
        throw new RuntimeException('A payment request is already being processed...');
    }

    try {
        // 2. Check if already paid
        $payment = $this->paymentService->find($orderId);
        if ($payment->isPaid()) {
            throw new RuntimeException('Your payment has already been processed...');
        }

        // 3. Get Fabric token
        $fabricToken = $this->getFabricToken();

        // 4. Reconciliation: if payment was initiated before, query Telebirr
        if ($this->isPaymentInitiated($orderId)) {
            $this->verifyAndReconcileTelebirrPayment($fabricToken, $payment);
            $payment->refresh();
            if ($payment->isPaid()) {
                throw new RuntimeException('Your payment has already been processed...');
            }
        }

        // 5. Create order with Telebirr
        $prepay_id = $this->requestCreateOrder($fabricToken, $data);

        // 6. Build rawRequest H5 URL
        return $this->createRawRequest($prepay_id);
    } finally {
        $lock->release();
    }
}
```

- Uses a lock to avoid concurrent payments for the same order.
- Stops early if payment is already paid.
- Performs reconciliation if a previous payment attempt exists.
- Creates a new order in Telebirr and builds the H5 checkout URL.

#### PreOrder request to Telebirr

```php
protected function requestCreateOrder($fabricToken, array $data)
{
    $url = $this->baseUrl . '/payment/v1/merchant/preOrder';
    $payload = self::createRequestObject($data);

    $response = Http::withHeaders([
        'Content-Type' => 'application/json',
        'X-APP-Key' => $this->fabricAppId,
        'Authorization' => $fabricToken,
    ])
    ->withOptions(['verify' => false])
    ->post($url, $payload);

    if ($response->failed()) {
        throw new RuntimeException("Create order request failed.");
    }

    $object = $response->object();
    return $object->biz_content->prepay_id ?? null;
}
```

- Calls Telebirr Fabric `preOrder` endpoint.
- Uses `X-APP-Key` and `Authorization` (Fabric token).
- Returns `prepay_id` from `biz_content`.

#### Building the preOrder payload

```php
protected function createRequestObject(array $data): array
{
    $merchantOrderId = TelebirrHelper::createMerchantOrderId();
    $payment = $this->paymentService->find($data['customerSurveyOrderId']);

    $payment->update(['merch_order_id' => $merchantOrderId]);

    $biz = [
        'notify_url'      => route('telebirr.notify'),   // Webhook URL
        'business_type'   => 'BuyGoods',
        'trade_type'      => 'Checkout',
        'appid'           => $this->merchantAppId,
        'merch_code'      => $this->merchantCode,
        'merch_order_id'  => (string) $merchantOrderId,
        'title'           => (string) $data['customerSurveyOrderId'],
        'total_amount'    => (string) number_format((float) $payment->total_amount, 2, '.', ''),
        'trans_currency'  => 'ETB',
        'timeout_express' => '120m',
        'payee_identifier'      => $this->merchantCode,
        'payee_identifier_type' => '04',
        'payee_type'            => '5000',
        'wallet_reference_data' => ['FBBID' => 'Et Online Fixed Service Provisioning'],
        'redirect_url'          => route('payment.success'),  // Where to send customer after payment
    ];

    $request = [
        'nonce_str'   => TelebirrHelper::createNonceStr(),
        'method'      => 'payment.preorder',
        'timestamp'   => TelebirrHelper::createTimeStamp(),
        'version'     => '1.0',
        'biz_content' => $biz,
        'sign_type'   => 'SHA256WithRSA',
    ];
    $request['sign'] = app(TelebirrSignerService::class)->sign($request);

    return $request;
}
```

- Generates unique `merch_order_id`, stores it on the payment.
- Sets `notify_url` for the webhook and `redirect_url` for customer redirect.
- Adds `biz_content` with order details and signs the request.

#### Building rawRequest (H5 checkout URL)

```php
protected function createRawRequest(string $prepayId): string
{
    $maps = [
        'appid'      => $this->merchantAppId,
        'merch_code' => $this->merchantCode,
        'nonce_str'  => TelebirrHelper::createNonceStr(),
        'prepay_id'  => $prepayId,
        'timestamp'  => TelebirrHelper::createTimeStamp(),
        'sign_type'  => 'SHA256WithRSA',
    ];

    $rawRequest = '';
    foreach ($maps as $map => $m) {
        $rawRequest .= $map . '=' . $m . "&";
    }
    $sign = app(TelebirrSignerService::class)->sign($maps);
    $rawRequest = $rawRequest . 'sign=' . $sign;
    $rawRequest = $this->webBaseUrl . $rawRequest . "&version=1.0&trade_type=Checkout";

    return trim((string) $rawRequest);
}
```

- Builds query string with `appid`, `merch_code`, `prepay_id`, etc.
- Signs the map, appends `sign`.
- Prefixes `webBaseUrl` and adds `version` and `trade_type` for the H5 page.

---

### 5.4 FabricTokenService: Token Acquisition

**File:** `app/Services/FabricTokenService.php`

```php
public function applyFabricToken()
{
    $response = Http::logged('FabricTokenService', 'payment')
        ->withHeaders([
            'Content-Type' => 'application/json',
            'X-APP-Key'    => $this->fabricAppId,
        ])
        ->timeout(30)
        ->withOptions(['verify' => false])
        ->post("{$this->baseUrl}/payment/v1/token", [
            'appSecret' => $this->appSecret,
        ]);

    if ($response->failed()) {
        throw new \RuntimeException("Telebirr API request to Fabric token endpoint failed.");
    }

    return $response->object();
}
```

- `POST` to `{base_url}/payment/v1/token` with `X-APP-Key` and `appSecret`.
- Returns token object (includes `token` and `expirationDate`).

---

### 5.5 TelebirrSignerService: RSA Signing

**File:** `app/Services/TelebirrSignerService.php`

```php
public function sign(array $request): string
{
    $string = $this->buildString($request);
    $sortedString = $this->sortedString($string);
    return $this->signWithRSA($sortedString);
}

public function buildString($request)
{
    $sorted = collect($request)
        ->sortKeys()
        ->reject(fn($value, $key) => in_array($key, $this->excludeFields))
        ->flatMap(function ($value, $key) {
            if ($key === 'biz_content' && is_array($value)) {
                return collect($value)->flatMap(function ($v, $k) {
                    if (is_array($v)) {
                        return collect($v)->mapWithKeys(fn($innerV, $innerK) => [$innerK => $innerV]);
                    }
                    return [$k => $v];
                });
            }
            return [$key => $value];
        });

    return $sorted->map(fn($value, $key) => "{$key}={$value}")->values()->implode('&');
}

function sortedString($stringApplet)
{
    return collect(explode('&', $stringApplet))->sort()->implode('&');
}

public function signWithRSA(string $data): ?string
{
    $rsa = PublicKeyLoader::loadPrivateKey(file_get_contents(storage_path('app/keys/private.pem')));
    $signatureByte = $rsa->sign($data);
    return base64_encode($signatureByte);
}
```

- Excludes `exclude_fields` (e.g. `sign`, `sign_type`).
- Flattens `biz_content` and nested arrays, sorts key-value pairs.
- Builds string like `appid=...&merch_code=...&...`, then sorts segments.
- Signs with RSA private key and returns Base64 signature.

---

### 5.6 TelebirrHelper: Utility Functions

**File:** `app/Helpers/TelebirrHelper.php`

```php
public static function createMerchantOrderId(): string
{
    return now()->format('YmdHisv') . random_int(10, 99);
}

public static function createTimeStamp(): string
{
    return (string) time();
}

public static function createNonceStr(): string
{
    return Str::upper(Str::random(32));
}
```

- `createMerchantOrderId`: `YYYYMMDDHHiissvv` + 2-digit random.
- `createTimeStamp`: Unix timestamp.
- `createNonceStr`: 32-char uppercase alphanumeric string.

---

### 5.7 PaymentService: Confirmation

**File:** `app/Services/Payment/PaymentService.php`

```php
public function confirmPayment(Payment $payment, array $providerPayload): void
{
    if ($payment->status === Payment::STATUS_PAID) {
        return;  // Idempotency
    }

    $isCompleted = ($providerPayload['trade_status'] ?? null) === 'Completed';

    DB::transaction(function () use ($payment, $providerPayload, $isCompleted) {
        if ($isCompleted) {
            $payment->update([
                'status'           => Payment::STATUS_PAID,
                'trans_id'         => $providerPayload['transId'] ?? null,
                'total_amount'     => $providerPayload['total_amount'] ?? $payment->total_amount,
                'payment_order_id' => $providerPayload['payment_order_id'] ?? null,
                'payload'          => json_encode($providerPayload),
            ]);
            SurveyOrder::where('customer_survey_order_id', $payment->customer_survey_order_id)
                ->update(['status' => FFDServiceProvisionStatus::Waiting->value]);
        } else {
            $payment->update(['status' => Payment::STATUS_FAILED]);
        }
    });

    if ($isCompleted) {
        $this->deductDeviceStock($payment->customer_survey_order_id);
        $this->activationService->activate($payment->customer_survey_order_id);
    }
}
```

- Skips if payment is already confirmed (idempotency).
- Treats `trade_status === 'Completed'` as success.
- In a transaction: updates payment and survey order status.
- After commit: deducts device stock and triggers service activation.

---

### 5.8 Reconciliation: Query Order Status

**File:** `app/Services/CreateOrderService.php`

```php
protected function verifyAndReconcileTelebirrPayment(string $fabricToken, Payment $payment): void
{
    $payment->update(['last_checked_at' => Carbon::now()]);

    $queryResult = $this->requestQueryOrder($fabricToken, $payment->merch_order_id);
    if (!$queryResult) return;

    $bizContent = $queryResult->biz_content ?? null;
    if (!$bizContent) return;

    $orderStatus = $bizContent->order_status ?? null;

    if ($orderStatus === 'PAY_SUCCESS') {
        $this->paymentService->confirmPayment($payment, [
            'trade_status'     => 'Completed',
            'transId'          => $bizContent->trans_id ?? null,
            'total_amount'     => $bizContent->total_amount ?? $payment->total_amount,
            'payment_order_id' => $bizContent->payment_order_id ?? null,
        ]);
    }
}
```

- Called when a previous payment attempt exists (`merch_order_id` set).
- Calls Telebirr `queryOrder` to get current status.
- If Telebirr reports `PAY_SUCCESS`, confirms payment in our system (handles missed webhooks).

**Query payload:**

```php
protected function buildQueryPayload(string $merchOrderId): array
{
    $request = [
        'nonce_str'   => TelebirrHelper::createNonceStr(),
        'method'      => 'payment.queryorder',
        'timestamp'   => TelebirrHelper::createTimeStamp(),
        'version'     => '1.0',
        'biz_content' => [
            'appid'         => $this->merchantAppId,
            'merch_code'    => $this->merchantCode,
            'merch_order_id'=> $merchOrderId,
        ],
        'sign_type'   => 'SHA256WithRSA',
    ];
    $request['sign'] = app(TelebirrSignerService::class)->sign($request);
    return $request;
}
```

---

## 6. Telebirr API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `{base_url}/payment/v1/token` | POST | Obtain Fabric authentication token |
| `{base_url}/payment/v1/merchant/preOrder` | POST | Create payment order, get `prepay_id` |
| `{base_url}/payment/v1/merchant/queryOrder` | POST | Query order status by `merch_order_id` |
| `{web_base_url}?...` | GET | H5 checkout page (redirect customer) |

---

## 7. App API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/create-order` | POST | Bearer | Create payment order, return `rawRequest` |
| `/telebirr/notify` | POST | None | Webhook for Telebirr payment result |
| `/payment/success` | GET | None | Success page after payment redirect |

**Route definitions:**

- `routes/api.php`: `Route::post('create-order', [TelebirrController::class, 'createOrder'])` (inside `auth:api`)
- `routes/web.php`: `Route::post('/telebirr/notify', [TelebirrController::class, 'notify'])->name('telebirr.notify')`

---

## 8. Security & Signing

- **Fabric token:** Obtained with `X-APP-Key` and `appSecret`, used as `Authorization` on preOrder/queryOrder.
- **RSA signing:** All requests to Telebirr are signed with `SHA256WithRSA` using `storage/app/keys/private.pem`.
- **Excluded fields:** `sign`, `sign_type`, `header`, etc. are not included in the signed string.
- **Webhook:** Currently validates presence of expected fields; signature verification can be added if Telebirr provides it.

---

## 9. Protection Layers (Double Payment Prevention)

| Layer | Mechanism |
|-------|-----------|
| **Cache lock** | `payment_lock:{order_id}` for 10 seconds prevents concurrent create-order calls |
| **DB check** | `Payment::isPaid()` blocks further payment attempts |
| **Reconciliation** | If `merch_order_id` exists, query Telebirr; if paid there, confirm locally |
| **Webhook idempotency** | `confirmPayment` returns early when `status === STATUS_PAID` |

---

## 10. Troubleshooting

### Customer says "I paid but order not updated"

1. Inspect logs: `storage/logs/payment/payment-YYYY-MM-DD.log`
2. Check payment row: `SELECT * FROM payments WHERE customer_survey_order_id = '...';`
3. If status is still pending, next "Pay" attempt will trigger reconciliation; ensure `notify_url` is HTTPS and reachable.

### Create order fails

- Verify `TELEBIRR_BASE_URL`, `TELEBIRR_APP_ID`, `TELEBIRR_APP_SECRET`, `TELEBIRR_MERCHANT_APP_ID`, `TELEBIRR_MERCHANT_CODE`.
- Ensure `storage/app/keys/private.pem` exists and matches the key registered with Telebirr.
- Check Fabric token endpoint connectivity.

### Webhook not received

- Confirm `NOTIFY_URL` or `route('telebirr.notify')` is HTTPS.
- Ensure `/telebirr/notify` is reachable from Telebirr (firewall, SSL).
- See `docs/HOST_NGINX_SETUP.md` and `docs/FIREWALL_ACCESS_REQUEST.md`.

---

## Related Documentation

- [TELEBIRR_TRAINING_MATERIAL.md](TELEBIRR_TRAINING_MATERIAL.md) – **Training material for students** (mechanisms, techniques, exercises)
- [PAYMENT_FLOW.md](PAYMENT_FLOW.md) – Payment flow diagram and protection logic
- [HOST_NGINX_SETUP.md](HOST_NGINX_SETUP.md) – SSL and Nginx configuration for callbacks
- [FIREWALL_ACCESS_REQUEST.md](FIREWALL_ACCESS_REQUEST.md) – Outbound access to Telebirr API
