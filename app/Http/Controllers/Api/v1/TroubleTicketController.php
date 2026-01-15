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
            // Use Query Builder for better performance - only get needed columns
            $ticketsQuery = DB::table('trouble_tickets')
                ->whereNull('deleted_at')
                ->where('customer_code', $user->customer_code)
                ->select([
                    'id',
                    'tt_serial_no',
                    'access_number',
                    'status',
                    // 'last_checked_at',
                    'last_synced_status',
                    'created_at',
                    'updated_at',
                    'customer_code',
                    'service_number',
                    'problem_type',
                    'problem_description',
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
            // if ($ticketsToRefresh->isNotEmpty()) {
            //     $this->batchRefreshTickets($ticketsToRefresh);
            // }

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

                if (!is_array($tt) || !isset($tt['tt_status'])) {
                    $timestampUpdates[] = $ticket->id;
                    continue;
                }

                $newStatus = strtolower($tt['tt_status']);

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
