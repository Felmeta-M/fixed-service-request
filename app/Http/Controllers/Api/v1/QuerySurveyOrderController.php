<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\QuerySurveyOrderService;
use Illuminate\Http\Request;


class QuerySurveyOrderController extends Controller
{

    public function __construct(protected readonly QuerySurveyOrderService $querySurveyOrderService) {}

    public function querySurveyOrder(Request $request)
    {
        $request->validate([
            'customer_survey_order_id' => 'required|string',
        ]);

        $data = $this->querySurveyOrderService->querySurveyOrderDetail(
            $request->input('customer_survey_order_id')
        );

        return response()->json($data);
    }
}
