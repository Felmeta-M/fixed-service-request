<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LocalAuthService
{
    public function __construct(protected QueryCustomerByServiceNumberService $queryCustomerByService)
    {
    }

    /**
     * Main entry point – orchestrates the flow
     */
    public function handle(?string $phoneNumber)
    {
        $data = $this->extractUserInfo($phoneNumber);

        $validation = $this->validateUserInfo($data);

        return match ($validation['status']) {
            'under_age' => $this->respondUnderAge(),
            'invalid_phone' => $this->respondInvalidPhone($data),
            'incomplete' => $this->respondIncomplete($data),
            'not_found' => $this->respondNotFound($data),
            'ok' => $this->completeLogin($data),
        };
    }

    private function extractUserInfo(?string $phoneNumber): array
    {
        if (!$phoneNumber || !preg_match('/^(09|\+2519)/', $phoneNumber)
        ) {
            return [];
        }
        $response = $this->queryCustomerByService->getCustomer('123555754');

        if (
            empty($response['success']) ||
            empty($response['customer'])
        ) {
            return [];
        }

        $customer = $response['customer'];
        //TODO: all crm data shall be extracted
        return [
            'customer_id' => $customer['id'] ?? null,
            'customer_code' => $customer['code'] ?? null,
            'name' => isset($customer['first_name'], $customer['last_name'])
                ? $customer['first_name'] . ' ' . $customer['last_name']
                : null,
            'email' => $customer['email'] ?? null,
            'phone' => $phoneNumber,
            'age' => $this->calculateAge($customer['dob'] ?? null),
        ];
    }

    private function calculateAge(?string $dob): ?int
    {
        if (!$dob) {
            return null;
        }

        try {
            return Carbon::parse($dob)->age;
        } catch (Exception $e) {
            return null; // invalid DOB format
        }
    }

    private function validateUserInfo(array $data): array
    {
        if (empty($data['name']) || empty($data['email']) || empty($data['phone'])) {
            return ['status' => 'incomplete'];
        }

        if ((int)$data['age'] < 18) {
            return ['status' => 'under_age'];
        }

        if (!preg_match('/^(09|\+2519)/', $data['phone'])) {
            return ['status' => 'invalid_phone'];
        }

        if (empty($data)) {
            return ['status' => 'not_found'];
        }

        return ['status' => 'ok'];
    }

    private function respondUnderAge()
    {
        return Inertia::render('Errors/UnderAge', [
            'message' => 'You must be at least 18 years old to use this service.',
        ]);
    }

    private function respondInvalidPhone(array $data)
    {
        return redirect()->route('customer.create')->with([
            'prefill' => $data,
            'error' => 'Your phone must be Ethio Telecom (09 or +2519).',
        ]);
    }

    private function respondIncomplete(array $data)
    {
        return redirect()->route('customer.create')->with([
            'prefill' => $data,
            'error' => 'Some required information is missing. Please enable your phone number and complete your profile.',
        ]);
    }

    private function respondNotFound(array $data)
    {
        // TODO: phone number missing shall be handling separately
        return redirect()->route('customer.create')->with([
            'error' => 'Your phone number required information but missing.',
        ]);
    }

    private function completeLogin(array $data)
    {
        $user = $this->resolveUser($data);

        Auth::guard('otp')->login($user);

        return redirect()->route('dashboard');
    }

    private function resolveUser(array $data): User
    {
        return Otp::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'name' => $data['name'],
                'phone' => $data['phone'],
            ]
        );
    }
}
