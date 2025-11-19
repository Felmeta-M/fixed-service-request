<?php

namespace App\Http\Controllers\Api\v1;


use App\Http\Controllers\Controller;
use App\Services\CreateOrderService;
use App\Services\PaymentService;
use App\Services\RsaSignatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class TelebirrController extends Controller
{

    public function __construct(
        protected readonly CreateOrderService  $createOrderService,
        protected readonly PaymentService      $paymentService,
        protected readonly RsaSignatureService $rsaSignatureService,
    )
    {
    }

    public function createOrder(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_code' => 'required|string',
                'title' => 'required|string',
                'amount' => 'required|numeric',
            ]);

            $rawRequest = $this->createOrderService->createOrder($validated);
            Log::info('raw request', $rawRequest);
            // $rawRequest = $this->rsaSignatureService->createOrder($request->title, (string)$request->amount);

            return response()->json([
                'success' => true,
                'rawRequest' => $rawRequest,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle Fabric payment notifications
     */
    public function paymentNotification(Request $request)
    {
        // Log incoming notification for debugging
        Log::info('Fabric payment notification received', $request->all());

        // TODO: verify signature here if Fabric sends one
        // $valid = SignatureHelper::verify($request->all());
        // if (!$valid) return response('Invalid signature', 400);

        // Extract necessary info
        $orderId = $request->input('merch_order_id');
        $status = $request->input('trade_status'); // or whatever field Fabric sends
        $amount = $request->input('total_amount');

        // TODO: Update order/payment status in DB
        // Order::where('merch_order_id', $orderId)->update(['status' => $status]);

        // Respond with 200 to acknowledge Fabric
        return response()->json([
            'success' => true,
            'message' => 'Notification received',
        ], Response::HTTP_OK);
    }
}
