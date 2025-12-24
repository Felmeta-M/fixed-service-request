<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTTRequest;
use App\Http\Requests\QueryTTRequest;
use App\Http\Requests\QueryTTDetailRequest;
use App\Http\Requests\ConfirmFeedbackRequest;
use App\Models\TroubleTicket;
use App\Services\CreateTTService;
use App\Services\QueryTTService;
use App\Services\QueryTTDetailService;
use App\Services\ConfirmFeedbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class TroubleTicketController extends Controller
{
    public function __construct(
        protected readonly CreateTTService $createTTService,
        protected readonly QueryTTService $queryTTService,
        protected readonly QueryTTDetailService $queryTTDetailService,
        protected readonly ConfirmFeedbackService $confirmFeedbackService
    ) {}

    public function index(Request $request)
    {
        $user = auth()->user();
    
        try {
            // Fetch tickets for this customer
            $ticketsQuery = TroubleTicket::query()
                ->where('customer_code', $user->customer_code);
        
            if ($request->filled('access_number')) {
                $ticketsQuery->where('access_number', $request->access_number);
            }
        
            if ($request->filled('status')) {
                $ticketsQuery->where('status', $request->status);
            }
        
            // Get paginated tickets
            $tickets = $ticketsQuery->latest()->paginate(10);
        
            // Refresh each ticket if needed (throttle inside refresh)
            foreach ($tickets as $ticket) {
                try {
                    $this->refreshTicket($ticket);
                } catch (\Throwable $e) {
                    // Log refresh error but continue processing remaining tickets
                    Log::warning('Failed to refresh ticket in index', [
                        'tt_serial_no' => $ticket->tt_serial_no ?? null,
                        'access_number' => $ticket->access_number ?? null,
                        'error' => $e->getMessage(),
                        'exception' => $e,
                    ]);
                    // Continue processing other tickets
                }
            }

            return response()->json([
                'success' => true,
                'data' => $tickets,
            ]);
        } catch (\Throwable $e) {
            // Log database query errors
            Log::error('Failed to fetch tickets in index', [
                'customer_code' => $user->customer_code ?? null,
                'error' => $e->getMessage(),
                'exception' => $e,
            ]);

            // Return valid JSON response even on error
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }
    }
    

    protected function refreshTicket(TroubleTicket $ticket)
    {
        // Throttle: skip if last checked < 5 minutes
        if ($ticket->last_checked_at && $ticket->last_checked_at->diffInMinutes(now()) < 5) {
            return;
        }
    
        try {
            // Call third-party TT service
            $response = $this->queryTTService->queryTT([
                'access_number' => $ticket->access_number,
            ]);
        } catch (RuntimeException $e) {
            // Handle rate limits, HTTP failures, XML parsing errors from BaseApiService
            Log::error('TT service call failed in refreshTicket', [
                'tt_serial_no' => $ticket->tt_serial_no ?? null,
                'access_number' => $ticket->access_number ?? null,
                'error' => $e->getMessage(),
                'exception' => $e,
            ]);
            return;
        } catch (\Throwable $e) {
            // Handle network timeouts, malformed responses, or other unexpected errors
            Log::error('Unexpected error during TT service call in refreshTicket', [
                'tt_serial_no' => $ticket->tt_serial_no ?? null,
                'access_number' => $ticket->access_number ?? null,
                'error' => $e->getMessage(),
                'exception' => $e,
            ]);
            return;
        }

        try {
            $payload = $response->getData(true);
            // Log::info('TT raw response', $payload);
        
            // Validate response structure before accessing nested data
            if (!is_array($payload) || !isset($payload['data'])) {
                Log::warning('Invalid response structure in refreshTicket', [
                    'tt_serial_no' => $ticket->tt_serial_no ?? null,
                    'access_number' => $ticket->access_number ?? null,
                    'payload_keys' => is_array($payload) ? array_keys($payload) : 'not an array',
                ]);
                return;
            }
        
            $data = $payload['data'] ?? null;
        
            if (empty($data['success']) || empty($data['tt_list'][0])) {
                return;
            }
        
            $tt = $data['tt_list'][0];
            
            // Validate tt structure before accessing tt_status
            if (!is_array($tt) || !isset($tt['tt_status'])) {
                Log::warning('Invalid tt structure in refreshTicket response', [
                    'tt_serial_no' => $ticket->tt_serial_no ?? null,
                    'access_number' => $ticket->access_number ?? null,
                    'tt_keys' => is_array($tt) ? array_keys($tt) : 'not an array',
                ]);
                return;
            }
        
            $newStatus = strtolower($tt['tt_status']);
        
            // Update only if status changed
            if ($ticket->status !== $newStatus) {
                try {
                    $ticket->update([
                        'status' => $newStatus,
                        'last_synced_status' => $newStatus,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Failed to update ticket status in refreshTicket', [
                        'tt_serial_no' => $ticket->tt_serial_no ?? null,
                        'access_number' => $ticket->access_number ?? null,
                        'new_status' => $newStatus,
                        'error' => $e->getMessage(),
                        'exception' => $e,
                    ]);
                    return;
                }
            }
        
            // Update last_checked_at timestamp
            try {
                $ticket->update(['last_checked_at' => now()]);
            } catch (\Throwable $e) {
                Log::error('Failed to update last_checked_at in refreshTicket', [
                    'tt_serial_no' => $ticket->tt_serial_no ?? null,
                    'access_number' => $ticket->access_number ?? null,
                    'error' => $e->getMessage(),
                    'exception' => $e,
                ]);
                // Don't return here - status update was successful, this is just a timestamp
            }
        } catch (\Throwable $e) {
            // Handle any unexpected errors during response processing
            Log::error('Unexpected error processing TT response in refreshTicket', [
                'tt_serial_no' => $ticket->tt_serial_no ?? null,
                'access_number' => $ticket->access_number ?? null,
                'error' => $e->getMessage(),
                'exception' => $e,
            ]);
            return;
        }
    }
    

    /**
     * Show single ticket by TT number
     */
    public function show(string $tt_serial_no)
    {
        $ticket = TroubleTicket::where('tt_serial_no', $tt_serial_no)->first();

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
