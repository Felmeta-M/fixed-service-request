<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use App\Services\LocalAuthService;
use App\Traits\InteractsWithSMSGateway;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class OtpAuthController extends Controller
{
    use InteractsWithSMSGateway;

    public function __construct(protected LocalAuthService $localAuthService)
    {
    }

    public function showPhoneForm()
    {
        return inertia('Auth/EnterPhone');
    }

    public function sendOneTimePassword(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|string',
            ]);
            $phone = substr($request->phone, -9);

            if (!preg_match('/^(?:\+2519|2519|09|9)\d{8}$/', $phone)) {
                return response()->json([
                    'errors' => [
                        'phone' => ['Phone number must be Ethio Telecom.'],
                    ],
                ], 422);
            }

            $otpCode = rand(100000, 999999);

            Otp::updateOrCreate(
                ['phone' => $phone],
                [
                    'code' => $otpCode,
                    'expires_at' => now()->addMinutes(5),
                ]
            );

            // Try sending SMS
            $this->sendSmsOnly($phone, $otpCode);

            // Success → redirect to OTP verify form
            return redirect()
                ->route('otp.verify.form')
                ->with('phone', $request->phone);
        } catch (Throwable $e) {
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => 'Failed to send OTP. Please try again.']);
        }
    }

    public function showVerifyForm()
    {
        $phone = session('phone');
        return inertia('Auth/VerifyOtp', ['phone' => $phone]);
    }

    public function verifyOneTimePassword(Request $request)
    {
        $otp = Otp::where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return back()->withErrors(['code' => 'Invalid or expired OTP']);
        }

        $this->localAuthService->handle($otp->phone);
    }

    public function logout(Request $request)
    {
        Auth::guard('otp')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
