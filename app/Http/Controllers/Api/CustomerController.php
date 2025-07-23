<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\QueryCustomerByCodeService;
use App\Services\QueryCustomerByServiceNumberService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected readonly QueryCustomerByServiceNumberService $query_customer_by_service_number_service,
        protected readonly QueryCustomerByCodeService $query_customer_by_code_service,
    ) {}

    public function getCustomerByServiceNumber(string $service_number)
    {

        if (!preg_match('/^\d+$/', $service_number)) {
            return response()->json(['error' => 'Invalid service number'], 422);
        }

        $response = $this->query_customer_by_service_number_service->getCustomer($service_number);

        return response()->json($response);
    }

    public function getCustomerByCode(string $code)
    {
        if (!preg_match('/^\d+$/', $code)) {
            return response()->json(['error' => 'Invalid customer code'], 422);
        }

        $response = $this->query_customer_by_code_service->getCustomer($code);

        return response()->json($response);
    }

    public function createCustomer() {}
}
