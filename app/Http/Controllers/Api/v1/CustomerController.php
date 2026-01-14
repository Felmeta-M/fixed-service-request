<?php

namespace App\Http\Controllers\Api\v1;


use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\CustomerCategory;
use App\Models\CustomerSubcategory;
use App\Models\CustomerType;
use App\Services\CustomerService;
use App\Services\QueryCustomerByCodeService;
use App\Services\QueryCustomerByServiceNumberService;
use Exception;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected readonly CustomerService $customerService,
        protected readonly QueryCustomerByServiceNumberService $queryCustomerByServiceNumberService,
        protected readonly QueryCustomerByCodeService $queryCustomerByCodeService,
    ) {
    }

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
    public function show(Request $request)
    {
        try {
            $customerSubId = $this->customerService->getLocalCustomerData($request->customer_sub_id);

            if (!$customerSubId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer sub ID not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => new CustomerResource($customerSubId)
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customer data'
            ], 500);
        }
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
        return CustomerType::query()->where('status', true)->get(['id', 'name', 'api_value']);
    }

    public function categories(Request $request)
    {
        $typeId = $request->query('type_id');
        if (!$typeId) {
            return response()->json(['error' => 'type_id is required'], 400);
        }
        return CustomerCategory::where('customer_type_id', $typeId)->where('status', true)->get(['id', 'name', 'api_value']);
    }

    public function subcategories(Request $request)
    {
        $categoryId = $request->query('category_id');
        if (!$categoryId) {
            return response()->json(['error' => 'category_id is required'], 400);
        }
        return CustomerSubcategory::where('customer_category_id', $categoryId)->where('status', true)->get(['id', 'name', 'api_value']);
    }
}
