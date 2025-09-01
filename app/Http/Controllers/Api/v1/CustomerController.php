<?php

namespace App\Http\Controllers\Api\v1;

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
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(CustomerRequest $customerRequest)
    {
        return $this->customerService->createCustomer($customerRequest->validated());
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function getCustomerByServiceNumber(Request $request)
    {
        if (!preg_match('/^\d+$/', $request->service_number)) {
            return response()->json(['error' => 'Invalid service number'], 422);
        }

        $response = $this->queryCustomerByServiceNumberService->getCustomer($request->service_number);

        return response()->json($response);
    }

    public function getCustomerByCode(Request $request)
    {
        if (!preg_match('/^\d+$/', $request->code)) {
            return response()->json(['error' => 'Invalid customer code'], 422);
        }

        $response = $this->queryCustomerByCodeService->getCustomer($request->code);

        return response()->json($response);
    }

    public function types()
    {
        return CustomerType::all(['id', 'code', 'name', 'api_value']);
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
}
