<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRequest;
use App\Models\CustomerCategory;
use App\Models\CustomerSubcategory;
use App\Models\CustomerType;
use App\Services\CustomerService;
use App\Services\QueryCustomerByCodeService;
use App\Services\QueryCustomerByServiceNumberService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected readonly CustomerService $customerService,
        protected readonly QueryCustomerByServiceNumberService $queryCustomerByServiceNumberService,
        protected readonly QueryCustomerByCodeService $queryCustomerByCodeService,
    ) {}

    public function getCustomerByServiceNumber(string $service_number)
    {

        if (!preg_match('/^\d+$/', $service_number)) {
            return response()->json(['error' => 'Invalid service number'], 422);
        }

        $response = $this->queryCustomerByServiceNumberService->getCustomer($service_number);

        return response()->json($response);
    }

    public function getCustomerByCode(string $code)
    {
        if (!preg_match('/^\d+$/', $code)) {
            return response()->json(['error' => 'Invalid customer code'], 422);
        }

        $response = $this->queryCustomerByCodeService->getCustomer($code);

        return response()->json($response);
    }

    public function types()
    {
        return CustomerType::all(['id', 'name', 'api_value']);
    }

    public function categories(Request $request)
    {
        $typeId = $request->query('type_id');
        if (!$typeId) {
            return response()->json(['error' => 'type_id is required'], 400);
        }
        return CustomerCategory::where('customer_type_id', $typeId)->get(['id', 'name', 'api_value']);
    }

    public function subcategories(Request $request)
    {
        $categoryId = $request->query('category_id');
        if (!$categoryId) {
            return response()->json(['error' => 'category_id is required'], 400);
        }
        return CustomerSubcategory::where('customer_category_id', $categoryId)->get(['id', 'name', 'api_value']);
    }

    public function store(CustomerRequest $customerRequest)
    {
        return $this->customerService->createCustomer($customerRequest->validated());

        // return response()->json(['success', 'Customer created successfully.']);
    }
}
