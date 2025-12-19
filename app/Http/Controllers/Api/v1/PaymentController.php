<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\SurveyType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function show(Request $request)
    {
        $data = $request->validate([
            'customer_survey_order_id' => ['required']
        ]);

        $payment = new PaymentResource(Payment::query()->where('customer_survey_order_id', $data['customer_survey_order_id']))->last()->first();

        return response()->json($request);
    }
}
