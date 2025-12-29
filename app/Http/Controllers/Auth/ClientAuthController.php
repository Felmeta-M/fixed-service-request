<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ServiceClient;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ClientAuthController extends Controller
{

    public function sendOneTimePassword(Request $request)
    {
        $phone = $request->input('phone');

        // ✅ Validate Ethio Telecom phone number
        if (! InteractsWithSMSGateway::ensurePhoneIsLocal($phone)) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['phone' => 'Invalid Ethio Telecom phone number.']);
        }

        // ✅ Normalize phone for internal processing
        $normalizedPhone = InteractsWithSMSGateway::normalizePhone($phone);

        try {
            // ✅ Send OTP via trait
            $otp = InteractsWithSMSGateway::sendOTP($normalizedPhone);

            // You can optionally flash a success message
            return redirect()
                ->back()
                ->with('status', 'OTP has been sent successfully.');
        } catch (\RuntimeException $e) {
            // Rate-limiting or business-level issue
            Log::warning('OTP sending blocked', [
                'phone'  => $normalizedPhone,
                'reason' => $e->getMessage(),
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => $e->getMessage()]);
        } catch (\Throwable $e) {
            // System-level failure
            Log::error('OTP sending failed unexpectedly', [
                'phone' => $normalizedPhone,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => 'Failed to send OTP. Please try again later.']);
        }
    }

    protected function NormalizePhone($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        return substr($phone, -9);
    }

    public function verifyOneTimePassword(Request $request)
    {
        try {
            // ✅ Verify the OTP using the trait
            $response = InteractsWithSMSGateway::verifyOTP($request->input('otp'));

            if ($response) {
                // ✅ OTP is valid, proceed to login
                $this->login($request);
                return [
                    'success' => true,
                    'message' => 'OTP verified successfully.'
                ];
            }

            // OTP invalid or expired
            return [
                'success' => false,
                'message' => 'Invalid or expired OTP.'
            ];
        } catch (\Throwable $e) {
            // System-level failure
            Log::error('OTP verification failed', [
                'otp'   => $request->input('otp'),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'OTP verification failed. Please try again later.'
            ];
        }
    }


    public function login(Request $request)
    {
        $phone = $this->NormalizePhone($request->phone);
        $client = ServiceClient::firstOrCreate([
            'phone' => $this->NormalizePhone($phone)
        ]);

        Auth::guard('client')->login($client);

        $user = Auth::guard('client')->user();

        return redirect()->intended(route('client.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('client.login');
    }
}
