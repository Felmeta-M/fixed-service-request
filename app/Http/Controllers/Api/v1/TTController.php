<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTTRequest;
use App\Http\Requests\QueryTTRequest;
use App\Http\Requests\QueryTTDetailRequest;
use App\Http\Requests\ConfirmFeedbackRequest;
use App\Services\CreateTTService;
use App\Services\QueryTTService;
use App\Services\QueryTTDetailService;
use App\Services\ConfirmFeedbackService;
use Illuminate\Http\JsonResponse;

class TTController extends Controller
{
    public function __construct(
        protected readonly CreateTTService $createTTService,
        protected readonly QueryTTService $queryTTService,
        protected readonly QueryTTDetailService $queryTTDetailService,
        protected readonly ConfirmFeedbackService $confirmFeedbackService
    ) {}

    public function store(CreateTTRequest $request): JsonResponse
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

    public function query(QueryTTRequest $request): JsonResponse
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

    public function detail(QueryTTDetailRequest $request): JsonResponse
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

    public function confirm(ConfirmFeedbackRequest $request): JsonResponse
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
