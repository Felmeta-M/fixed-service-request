<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function __construct(protected readonly CustomerService $customerService)
    {
    }

    public function index()
    {
        //        return Inertia::render('Customers/Index', [
        //            'customers' => Customer::latest()->paginate(10),
        //        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create', [
            'prefill' => session('prefill'),
            'error' => session('error'),
        ]);
    }

    public function store(CustomerRequest $request)
    {
        //        DB::transaction(function ($request) {
        // TODO: handle by transaction
        // third party api
        //            return $this->customerService->createCustomer($request->validated());
        //        });

        //        $validated = $request->validate([
        //            'name'        => 'required|string|max:255',
        //            'email'       => 'required|email',
        //            'phone'       => 'required|string',
        //            'age'         => 'required|integer|min:18',
        //            'customer_id' => 'nullable|string',
        //            'customer_code' => 'nullable|string',
        //            'first_name'  => 'nullable|string',
        //            'middle_name' => 'nullable|string',
        //            'last_name'   => 'nullable|string',
        //        ]);
        //
        //        // Find or create the user
        //        $user = User::updateOrCreate(
        //            ['email' => $validated['email']],
        //            [
        //                'name'          => $validated['name'],
        //                'phone'         => $validated['phone'],
        //                'age'           => $validated['age'],
        //                'customer_id'   => $validated['customer_id'] ?? null,
        //                'customer_code' => $validated['customer_code'] ?? null,
        //                'first_name'    => $validated['first_name'] ?? null,
        //                'middle_name'   => $validated['middle_name'] ?? null,
        //                'last_name'     => $validated['last_name'] ?? null,
        //            ]
        //        );
        //
        //        // Log the user in
        //        Auth::login($user);
        //
        //        return redirect()->route('dashboard');
        //        return redirect()->route('customers.index')->with('success', 'Customer created successfully.');
    }

    //    public function show(Customer $customer)
    //    {
    //        return Inertia::render('Customers/Show', [
    //            'customer' => $customer,
    //        ]);
    //    }

    public function show(Request $request)
    {

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
