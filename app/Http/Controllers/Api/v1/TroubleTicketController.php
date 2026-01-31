<?php

namespace App\Http\Controllers\Api\v1;

use RuntimeException;
use App\Enums\TicketStatus;
use Illuminate\Http\Request;
use App\Models\TroubleTicket;
use App\Services\QueryTTService;
use App\Services\CreateTTService;
use App\Services\Logging\AppLogger;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Http\Requests\QueryTTRequest;
use App\Http\Requests\CreateTTRequest;
use App\Services\QueryTTDetailService;
use App\Services\ConfirmFeedbackService;
use App\Http\Requests\QueryTTDetailRequest;
use App\Http\Requests\ConfirmFeedbackRequest;
use App\Services\QueryCustomerForTTService;
use App\Services\GetCombiningService;
use App\Models\TroubleTicketReason;

class TroubleTicketController extends Controller
{
    // Default network type fallback (Fixed Line = 4)
    private const DEFAULT_NETWORK_TYPE = 4;

    public function __construct(
        protected readonly CreateTTService $createTTService,
        protected readonly QueryTTService $queryTTService,
        protected readonly QueryTTDetailService $queryTTDetailService,
        protected readonly ConfirmFeedbackService $confirmFeedbackService,
        protected readonly QueryCustomerForTTService $queryCustomerForTTService,
        protected readonly GetCombiningService $getCombiningService
    ) {
    }

    /**
     * Query customer by service number before TT creation
     * This validates the service number and returns customer info
     */
    public function queryCustomerByServiceNumber(Request $request)
    {
        $request->validate([
            'service_number' => 'required|string|min:6',
        ]);

        try {
            $serviceNumber = $request->input('service_number');
            $result = $this->queryCustomerForTTService->query($serviceNumber);

            if (!($result['success'] ?? false)) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Service number not found. Please verify the number and try again.',
                ], 404);
            }

            // Return customer info for frontend display
            $customer = $result['customer'] ?? [];
            $addresses = $result['addresses'][0] ?? [];

            return response()->json([
                'success' => true,
                'message' => 'Customer found',
                'data' => [
                    'customer_code' => $customer['customer_code'] ?? '',
                    'customer_name' => trim(($customer['first_name'] ?? '') . ' ' . ($customer['middle_name'] ?? '') . ' ' . ($customer['last_name'] ?? '')),
                    'first_name' => $customer['first_name'] ?? '',
                    'middle_name' => $customer['middle_name'] ?? '',
                    'last_name' => $customer['last_name'] ?? '',
                    'customer_type' => $customer['customer_type'] ?? '',
                    'customer_level' => $customer['customer_level'] ?? '',
                    'address' => [
                        'region' => $addresses['address1'] ?? '',
                        'zone' => $addresses['address3'] ?? '',
                        'city' => $addresses['address2'] ?? '',
                        'wereda' => $addresses['address4'] ?? '',
                        'kebele' => $addresses['address5'] ?? '',
                        'house_no' => $addresses['address6'] ?? '',
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            AppLogger::api()->error('Failed to query customer by service number', [
                'service_number' => $request->input('service_number'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to query service number. Please try again.',
            ], 500);
        }
    }

    /**
     * Lookup service number to fetch customer profile and trouble ticket reasons
     * 
     * This endpoint is used by both anonymous and authenticated users.
     * It calls the third-party API (GetCombiningService) to fetch the customer profile,
     * then uses the network type (tele_type) to fetch relevant trouble ticket reasons.
     * 
     * SECURITY: Full API response is cached server-side in session.
     * Only minimal, non-confidential data is returned to frontend.
     * 
     * Flow:
     * 1. Validate service number
     * 2. Call GetCombiningService to fetch customer profile
     * 3. Cache full response in session (for TT creation - avoids double API call)
     * 4. Extract tele_type (network type) from response
     * 5. Query local DB for trouble ticket reasons by network type
     * 6. If no network type or no reasons found, fallback to Fixed Line (4)
     * 7. Return ONLY minimal, non-confidential data to frontend
     */
    public function lookupServiceNumber(Request $request)
    {
        $request->validate([
            'service_number' => 'required|string|min:6',
        ]);

        try {
            $serviceNumber = $request->input('service_number');

            // Step 1: Call GetCombiningService to fetch customer profile from third-party API
            $combiningResponse = $this->getCombiningService->getByServiceNumber($serviceNumber);
            $responseData = $combiningResponse->getData(true);

            if (!($responseData['success'] ?? false)) {
                $rawMessage = $responseData['message'] ?? '';

                // Distinguish between API failures vs "not found" scenarios
                $isApiFailure = str_contains($rawMessage, 'API request')
                    || str_contains($rawMessage, 'timed out')
                    || str_contains($rawMessage, 'failed');

                if ($isApiFailure) {
                    // Server/network error - suggest retry
                    $message = 'Unable to verify service number due to a temporary issue. Please try again.';
                    $statusCode = 503; // Service Unavailable
                    AppLogger::api()->warning('LookupServiceNumber: API call failed (server issue)', [
                        'service_number' => $serviceNumber,
                        'raw_message' => $rawMessage,
                    ]);
                } else {
                    // Actual not found or validation error
                    $message = $rawMessage ?: 'Service number not found. Please verify the number and try again.';
                    $statusCode = 404;
                    AppLogger::api()->warning('LookupServiceNumber: Service number not found', [
                        'service_number' => $serviceNumber,
                        'message' => $message,
                    ]);
                }

                // Clear any stale session data for this service number
                session()->forget("tt_lookup_{$serviceNumber}");

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], $statusCode);
            }

            // Step 2: Extract data from the response
            $data = $responseData['data'] ?? [];
            $customer = $data['customer'] ?? [];
            $subscriber = $data['subscriber'] ?? [];
            $addresses = $data['addresses'][0] ?? [];
            $payment = $data['payment'] ?? [];
            $extParams = $data['ext_params'] ?? [];

            // Step 3: Cache FULL response in session (server-side only, NOT sent to frontend)
            // This avoids double API calls - CreateTTService will use this cached data
            // Session expires after 30 minutes or when TT is successfully created
            $sessionKey = "tt_lookup_{$serviceNumber}";
            session()->put($sessionKey, [
                'data' => $data,
                'cached_at' => now()->timestamp,
                'expires_at' => now()->addMinutes(30)->timestamp,
            ]);

            // Get customer name from ExtParams if FirstName is empty (API returns name in ExtParams.CustomerName)
            $customerName = !empty($customer['first_name'])
                ? $customer['first_name']
                : ($extParams['CustomerName'] ?? '');

            // Step 4: Get network type (tele_type) from payment section
            // Default to Fixed Line (4) if not found
            $networkType = !empty($payment['tele_type'])
                ? (int) $payment['tele_type']
                : self::DEFAULT_NETWORK_TYPE;

            // Step 5: Fetch trouble ticket reasons from local DB based on network type
            $troubleReasons = TroubleTicketReason::active()
                ->byNetworkType($networkType)
                ->select(['id', 'network_type', 'network_name', 'reason_path', 'reason'])
                ->get();

            // Step 6: If no reasons found for this network type, fallback to Fixed Line (4)
            if ($troubleReasons->isEmpty() && $networkType !== self::DEFAULT_NETWORK_TYPE) {
                AppLogger::api()->info('LookupServiceNumber: No reasons for network type, falling back to Fixed Line', [
                    'service_number' => $serviceNumber,
                    'original_network_type' => $networkType,
                    'fallback_network_type' => self::DEFAULT_NETWORK_TYPE,
                ]);

                $networkType = self::DEFAULT_NETWORK_TYPE;
                $troubleReasons = TroubleTicketReason::active()
                    ->byNetworkType($networkType)
                    ->select(['id', 'network_type', 'network_name', 'reason_path', 'reason'])
                    ->get();
            }

            // Get network name from reasons or default
            $networkName = $troubleReasons->first()?->network_name ?? 'Fixed Line';

            AppLogger::api()->info('LookupServiceNumber: Success (cached in session)', [
                'service_number' => $serviceNumber,
                'network_type' => $networkType,
                'network_name' => $networkName,
                'reasons_count' => $troubleReasons->count(),
            ]);

            // Step 7: Return ONLY non-confidential data to frontend
            // SECURITY: No customer names, IDs, account codes, or sensitive data exposed
            return response()->json([
                'success' => true,
                'message' => 'Service number verified',
                'data' => [
                    // Network info (non-confidential)
                    'network' => [
                        'type' => $networkType,
                        'name' => $networkName,
                    ],
                    // Trouble ticket reasons for this network type
                    'trouble_reasons' => $troubleReasons->map(fn($reason) => [
                        'id' => $reason->id,
                        'reason_path' => $reason->reason_path,
                        'reason' => $reason->reason,
                        'label' => $reason->reason,
                        'value' => $reason->reason_path,
                    ])->values(),
                ],
            ]);
        } catch (\Throwable $e) {
            AppLogger::api()->error('LookupServiceNumber: Exception', [
                'service_number' => $request->input('service_number'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to lookup service number. Please try again.',
            ], 500);
        }
    }

    public function index(Request $request)
    {
        $user = auth()->user();

        try {
            // Use Query Builder for better performance - get all fields needed for list and detail views
            $ticketsQuery = DB::table('trouble_tickets')
                ->whereNull('deleted_at')
                ->where('customer_code', $user->customer_code)
                ->select([
                    'id',
                    'tt_serial_no',
                    'access_number',
                    'status',
                    'last_synced_status',
                    'last_checked_at',
                    'created_at',
                    'updated_at',
                    'customer_code',
                    // Service owner info
                    'service_owner_code',
                    'service_owner_name',
                    'service_owner_type',
                    'service_owner_level',
                    // Address fields
                    'region',
                    'zone',
                    'city',
                    'sub_city',
                    'wereda',
                    'kebele',
                    'house_no',
                    // TT details
                    'contact_person',
                    'mobile_no',
                    'trouble_title',
                    'trouble_reason',
                    'tt_description',
                ]);

            if ($request->filled('tt_serial_no')) {
                $ticketsQuery->where('tt_serial_no', 'like', '%' . $request->tt_serial_no . '%');
            }

            if ($request->filled('access_number')) {
                $ticketsQuery->where('access_number', 'like', '%' . $request->access_number . '%');
            }

            if ($request->filled('status')) {
                $ticketsQuery->where('status', $request->status);
            }

            // Get paginated tickets
            $tickets = $ticketsQuery->latest('created_at')->paginate(10);

            // Collect tickets that need refresh
            $ticketsToRefresh = collect($tickets->items())
                ->filter(function ($ticket) {
                    // Only refresh active tickets that haven't been checked in 5 minutes
                    if (!in_array($ticket->status, TicketStatus::active(), true)) {
                        return false;
                    }

                    if ($ticket->last_checked_at) {
                        $lastChecked = \Carbon\Carbon::parse($ticket->last_checked_at);
                        if ($lastChecked->diffInMinutes(now()) < 5) {
                            return false;
                        }
                    }

                    return true;
                });

            // Batch refresh tickets and collect updates
            if ($ticketsToRefresh->isNotEmpty()) {
                $this->batchRefreshTickets($ticketsToRefresh);
            }

            return response()->json([
                'success' => true,
                'data' => $tickets,
            ]);
        } catch (\Throwable $e) {
            AppLogger::api()->error('Failed to fetch tickets', [
                'customer_code' => $user->customer_code ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
    }

    /**
     * Batch refresh multiple tickets and update them efficiently
     */
    protected function batchRefreshTickets($tickets): void
    {
        $updates = [];
        $timestampUpdates = [];

        foreach ($tickets as $ticket) {
            try {
                $response = $this->queryTTService->queryTT([
                    'access_number' => $ticket->access_number,
                ]);

                $payload = $response->getData(true);

                if (!is_array($payload) || !isset($payload['data'])) {
                    continue;
                }

                $data = $payload['data'] ?? null;

                if (empty($data['success']) || empty($data['tt_list'][0])) {
                    $timestampUpdates[] = $ticket->id;
                    continue;
                }

                $tt = $data['tt_list'][0];

                if (!is_array($tt)) {
                    $timestampUpdates[] = $ticket->id;
                    continue;
                }

                // Resolve status from API response using currentActivity + ttStatus
                $currentActivity = $tt['current_activity'] ?? '';
                $ttStatus = $tt['tt_status'] ?? '';
                $newStatus = TicketStatus::fromApiResponse($currentActivity, $ttStatus)->value;

                if ($ticket->status !== $newStatus) {
                    $updates[$ticket->id] = $newStatus;
                }

                $timestampUpdates[] = $ticket->id;
            } catch (\Throwable $e) {
                AppLogger::api()->warning('Failed to refresh ticket', [
                    'tt_serial_no' => $ticket->tt_serial_no ?? null,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Batch update statuses using CASE statement
        if (!empty($updates)) {
            $this->batchUpdateStatus($updates);
        }

        // Batch update last_checked_at timestamps
        if (!empty($timestampUpdates)) {
            //TODO: remove this after testing
            DB::table('trouble_tickets')
                ->whereIn('id', $timestampUpdates)
                ->update(['last_checked_at' => now()]);
        }
    }

    /**
     * Batch update ticket statuses using a single query
     */
    protected function batchUpdateStatus(array $updates): void
    {
        if (empty($updates)) {
            return;
        }

        $cases = [];
        $syncCases = [];
        $ids = [];
        $bindings = [];

        foreach ($updates as $id => $status) {
            $cases[] = "WHEN id = ? THEN ?";
            $syncCases[] = "WHEN id = ? THEN ?";
            $bindings[] = $id;
            $bindings[] = $status;
            $ids[] = $id;
        }

        // Add bindings for sync cases
        foreach ($updates as $id => $status) {
            $bindings[] = $id;
            $bindings[] = $status;
        }

        $caseStatement = implode(' ', $cases);
        $syncCaseStatement = implode(' ', $syncCases);
        $idPlaceholders = implode(',', array_fill(0, count($ids), '?'));
        $bindings = array_merge($bindings, $ids);

        DB::update(
            "UPDATE trouble_tickets 
             SET status = CASE {$caseStatement} END,
                 last_synced_status = CASE {$syncCaseStatement} END,
                 updated_at = NOW()
             WHERE id IN ({$idPlaceholders})",
            $bindings
        );

        AppLogger::api()->info('Batch updated ticket statuses', [
            'count' => count($updates),
        ]);
    }

    /**
     * Show single ticket by TT number - optimized with Query Builder
     */
    public function show(string $tt_serial_no)
    {
        $ticket = DB::table('trouble_tickets')
            ->whereNull('deleted_at')
            ->where('tt_serial_no', $tt_serial_no)
            ->first();

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Trouble Ticket not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    public function store(CreateTTRequest $request)
    {
        $data = $request->validated();
        try {
            $result = $this->createTTService->createTT($data);
            return $result;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'TT creation failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function query(QueryTTRequest $request)
    {
        $data = $request->validated();
        try {
            $result = $this->queryTTService->queryTT($data);
            return $result;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'TT query failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function detail(QueryTTDetailRequest $request)
    {
        $data = $request->validated();
        try {
            $result = $this->queryTTDetailService->queryTTDetail($data);
            return $result;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'TT detail query failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function confirm(ConfirmFeedbackRequest $request)
    {
        $data = $request->validated();
        try {
            $result = $this->confirmFeedbackService->confirmFeedback($data);
            return $result;
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'TT feedback confirmation failed.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
