<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerRequest;
use App\Services\CustomerService;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function __construct(protected readonly CustomerService $customerService) {}

    public function index()
    {
        return Inertia::render('Customers/Index', [
            'customers' => Customer::latest()->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    public function store(CustomerRequest $request)
    {
        DB::transaction(function ($request) {
            //TODO: handle by transaction
            //third party api
            return $this->customerService->createCustomer($request->validated());
        });

        return redirect()->route('customers.index')->with('success', 'Customer created successfully.');
    }

    public function show(Customer $customer)
    {
        return Inertia::render('Customers/Show', [
            'customer' => $customer,
        ]);
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer)
    {
        $customer->update($request->validated());

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted successfully.');
    }
}
