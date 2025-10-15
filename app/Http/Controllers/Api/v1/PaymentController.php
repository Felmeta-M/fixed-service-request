<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Payment;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Enums\FFDServiceProvisionStatus;

class PaymentController extends Controller
{
    public function index()
    {
        return PaymentResource::collection(Payment::latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_code'    => 'required|string|max:255',
            'reference_number' => 'required|string|max:255|unique:payments',
            'amount'           => 'required|numeric|min:0',
            'payload'          => 'nullable|array',
        ]);

        $payment = Payment::create([
            ...$validated,
            'status' => FFDServiceProvisionStatus::Pending,
        ]);

        return new PaymentResource($payment);
    }

    public function show(Payment $payment)
    {
        return new PaymentResource($payment);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'amount'  => 'nullable|numeric|min:0',
            'payload' => 'nullable|array',
            'status'  => 'nullable|string|in:' . implode(',', array_column(FFDServiceProvisionStatus::cases(), 'value')),
        ]);

        $payment->update($validated);

        return new PaymentResource($payment);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json(['message' => 'Payment deleted successfully.']);
    }
}
