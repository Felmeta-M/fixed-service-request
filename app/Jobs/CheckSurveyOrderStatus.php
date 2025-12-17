<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\SurveyRequest;
use App\Services\QueryDataSurveyOrderService;
use App\Enums\FFDServiceProvisionStatus;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Support\Facades\Auth;

class CheckSurveyOrderStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    use InteractsWithSMSGateway;

    public function __construct()
    {
        //
    }

    public function handle()
    {
        // Resolve service at runtime
        $user = Auth::guard('otp')->user();
        $queryDataSurveyOrderService = app(QueryDataSurveyOrderService::class);

        $pendingOrders = SurveyRequest::where(
            'status',
            FFDServiceProvisionStatus::Pending->value
        )->get();

        foreach ($pendingOrders as $order) {
            try {
                $response = $queryDataSurveyOrderService->querySurveyOrderDetail(
                    $order->customer_survey_order_id
                );

                $data = $response instanceof \Illuminate\Http\JsonResponse
                    ? $response->getData(true)
                    : $response;

                Log::info('data ', [$data]);

                if (($data['success'] ?? false) === true) {
                    $subOrders = $data['sub_orders'] ?? [];
                    Log::info('sub orders ', [$subOrders]);
                    if (!empty($subOrders)) {
                        //send success message
                        $message = "Your service request has been successfully";
                        //  $this->sendSmsOnly($user->phone, $otpCode);
                        $order->status = $subOrders[0]['OrderStatus'];
                        $order->save();
                    }
                } else {
                    Log::error(
                        "Failed to fetch status for order {$order->id}: " .
                            ($data['ret_msg'] ?? 'Unknown error')
                    );
                }
            } catch (\Throwable $e) {
                Log::error("Exception while updating order {$order->id}: " . $e->getMessage());
            }
        }
    }
}
