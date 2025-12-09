<?php

namespace App\Services;

use App\Models\Otp;
use Carbon\Carbon;
use Exception;
use Hash;
use Str;

class LocalAuthService
{
    public function __construct(
        protected QueryCustomerByServiceNumberService $queryCustomerByService
    )
    {
    }

    /**
     * Main entry point – returns structured business results
     */
    public function handle(string|int $phoneNumber): array
    {
        $data = $this->extractUserInfo($phoneNumber);

        if (empty($data)) {
            return ['status' => 'not_found'];
        }

        $validation = $this->validateUserInfo($data);

        return match ($validation['status']) {
            'under_age' => ['status' => 'under_age'],
            'invalid_phone' => ['status' => 'invalid_phone', 'data' => $data],
            'incomplete' => ['status' => 'incomplete', 'data' => $data],
            'not_found' => ['status' => 'not_found'],

            'ok' => [
                'status' => 'ok',
                'data' => $data,
            ],
        };
    }

    /**
     * Extracts CRM data for the provided phone number
     */
    private function extractUserInfo(string $phoneNumber): array
    {
        if (!$phoneNumber || !preg_match('/^(09|9|\+2519)/', $phoneNumber)) {
            return [];
        }
        $response = $this->queryCustomerByService->getCustomer('123555754');
        $response = json_decode($response->getContent(), true);
        if (
            empty($response['success']) ||
            empty($response['data']['customer'])
        ) {
            return [];
        }

        $customer = $response['data']['customer'];

        return [
            'customer_id' => $customer['id'] ?? null,
            'customer_code' => $customer['code'] ?? null,
            'name' => (isset($customer['first_name'], $customer['last_name']))
                ? "{$customer['first_name']} {$customer['last_name']}"
                : null,
            'email' => $customer['email'] ?? null,
            'phone' => $customer['phone'] ?? null,
            'age' => $this->calculateAge($customer['dob'] ?? null),
        ];
    }

    /**
     * Calculates age from DOB or returns null
     */
    private function calculateAge(?string $dob): ?int
    {
        if (!$dob) return null;

        try {
            return Carbon::parse($dob)->age;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Validates user information
     */
    private function validateUserInfo(array $data): array
    {
        if (empty($data)) {
            return ['status' => 'not_found'];
        }

        if (empty($data['name']) || empty($data['phone'])) {
            return ['status' => 'incomplete'];
        }

        if (!preg_match('/^(09|9|\+2519)/', $data['phone'])) {
            return ['status' => 'invalid_phone'];
        }

        if ((int)$data['age'] < 18) {
            return ['status' => 'under_age'];
        }

        return ['status' => 'ok'];
    }

    /**
     * Creates or retrieves a user — but does NOT log in.
     * Login must be done in controller.
     */
    public function resolveUserForAuth(array $data): Otp
    {
        logger('opt', $data);
        $token = Str::random(60);
        return Otp::updateOrCreate(
            ['phone_number' => $data['phone_number']],
            [
                'customer_sub_id' => $data['customer_sub_id'],
                'customer_code' => $data['customer_code'],
                'name' => $data['name'],
                'api_token' => Hash::make($token),
            ]
        );

    }
}
