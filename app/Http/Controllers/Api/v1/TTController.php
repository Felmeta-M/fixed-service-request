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

class TTController extends Controller
{
    public function __construct(
        protected readonly CreateTTService $createTTService,
        protected readonly QueryTTService $queryTTService,
        protected readonly QueryTTDetailService $queryTTDetailService,
        protected readonly ConfirmFeedbackService $confirmFeedbackService
    ) {}

    public function index(Request $request)
    {
        $query = TroubleTicket::query();

        if ($request->filled('access_number')) {
            $query->where('access_number', $request->access_number);
        }

        if ($request->filled('mobile_no')) {
            $query->where('mobile_no', $request->mobile_no);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate(10),
        ]);
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
