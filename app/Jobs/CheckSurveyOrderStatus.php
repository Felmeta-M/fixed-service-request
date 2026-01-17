<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use App\Enums\FFDServiceProvisionStatus;
use App\Services\QuerySurveyOrderService;
use App\Services\Logging\AppLogger;

class CheckSurveyOrderStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 3;

    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $queryDataSurveyOrderService = app(QuerySurveyOrderService::class);

        // Use Query Builder with chunking for better memory efficiency
        // Only select columns we need
        DB::table('survey_orders')
            ->whereNull('deleted_at')
            ->where('status', FFDServiceProvisionStatus::Waiting->value)
            ->select(['id', 'customer_survey_order_id', 'status'])
            ->orderBy('id')
            ->chunk(100, function ($orders) use ($queryDataSurveyOrderService) {
                $updates = [];

                foreach ($orders as $order) {
                    try {
                        $response = $queryDataSurveyOrderService->querySurveyOrderDetail(
                            $order->customer_survey_order_id
                        );

                        $data = $response instanceof \Illuminate\Http\JsonResponse
                            ? $response->getData(true)
                            : $response;

                        if (($data['success'] ?? false) === true) {
                            $subOrders = $data['sub_orders'] ?? [];

                            if (!empty($subOrders) && isset($subOrders[0]['OrderStatus'])) {
                                $newStatus = $subOrders[0]['OrderStatus'];

                                if ($order->status !== $newStatus) {
                                    $updates[$order->id] = $newStatus;
                                }
                            }
                        } else {
                            AppLogger::jobs()->warning('Failed to fetch survey order status', [
                                'order_id' => $order->id,
                                'customer_survey_order_id' => $order->customer_survey_order_id,
                                'error' => $data['ret_msg'] ?? 'Unknown error',
                            ]);
                        }
                    } catch (\Throwable $e) {
                        AppLogger::jobs()->error('Exception checking survey order status', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // Batch update all changed orders
                if (!empty($updates)) {
                    $this->batchUpdateStatus($updates);
                }
            });
    }

    /**
     * Batch update order statuses using a single query with CASE statement
     */
    protected function batchUpdateStatus(array $updates): void
    {
        if (empty($updates)) {
            return;
        }

        $cases = [];
        $ids = [];
        $bindings = [];

        foreach ($updates as $id => $status) {
            $cases[] = "WHEN id = ? THEN ?";
            $bindings[] = $id;
            $bindings[] = $status;
            $ids[] = $id;
        }

        $caseStatement = implode(' ', $cases);
        $idPlaceholders = implode(',', array_fill(0, count($ids), '?'));
        $bindings = array_merge($bindings, $ids);

        DB::update(
            "UPDATE survey_orders 
             SET status = CASE {$caseStatement} END, 
                 updated_at = NOW() 
             WHERE id IN ({$idPlaceholders})",
            $bindings
        );

        AppLogger::jobs()->info('Batch updated survey order statuses', [
            'count' => count($updates),
            'order_ids' => array_keys($updates),
        ]);
    }
}
