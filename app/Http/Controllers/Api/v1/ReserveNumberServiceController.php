<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\ReserveNumberService;

class ReserveNumberServiceController extends Controller
{
    public function __construct(protected readonly ReserveNumberService $reserveNumberService) {}

    public function release(string $serviceNumber)
    {
        $data = [
            'res_type_id' => 10,
            'oper_type' => 1030,
            'res_code' => $serviceNumber,
        ];

        return $this->reserveNumberService->unpick($data);
    }
}
