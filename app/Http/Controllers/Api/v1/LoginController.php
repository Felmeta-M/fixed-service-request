<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    public function login(Request $request)
    {

        $credentials = $this->resolveCredentials($request);

        $customer = Customer::firstOrCreate($credentials);

        $token = Str::random(60);
        $customer->api_token = $token;
        $customer->save();

        return response()->json([
            'token' => $token,
            'customer' => $customer->code,
        ]);
    }

    protected function resolveCredentials(Request $request): array
    {
        return $request->validate([
            'code' => 'required|max:255',
        ]);
    }


    protected function normalizePhone(string $phone): string
    {
        // Extract last 9 digits (e.g. +251912345678 => 912345678)
        return preg_replace('/[^0-9]/', '', substr($phone, -9));
    }

    protected function respondWithToken($customer, string $token)
    {
        return response()->json([
            'token' => $token,
            'customer' => [
                'id' => $customer->id,
                'code' => $customer->name,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke the current access token
        $request->guard('customer')->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function customer(Request $request)
    {
        $user =  $request->user();

        return [
            'code' => $user->code,
        ];
    }
}
