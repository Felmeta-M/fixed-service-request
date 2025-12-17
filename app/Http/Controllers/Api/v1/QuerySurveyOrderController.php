<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\QueryDataSurveyOrderService;
use Illuminate\Http\Request;


class QuerySurveyOrderController extends Controller
{

    public function __construct(protected readonly QueryDataSurveyOrderService $queryDataSurveyOrderService) {}

    public function querySurveyOrder(Request $request)
    {
        $request->validate([
            'customer_survey_order_id' => 'required|string',
        ]);

        $data = $this->queryDataSurveyOrderService->querySurveyOrderDetail(
            $request->input('customer_survey_order_id')
        );

        return response()->json($data);
    }
}
