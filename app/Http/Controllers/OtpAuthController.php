<?php

namespace App\Http\Controllers;

use App\Traits\InteractsWithSMSGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Otp;
use Carbon\Carbon;

class OtpAuthController extends Controller
{
    use InteractsWithSMSGateway;
    public function showPhoneForm()
    {
        return inertia('Auth/EnterPhone');
    }

    public function sendOneTimePassword(Request $request)
    {
        // Validate request
        $request->validate([
            'phone' => 'required|string|min:10|max:15',
        ]);

        try {
            $otpCode = rand(100000, 999999);

            // Save or update OTP
            Otp::updateOrCreate(
                ['phone' => $request->phone],
                [
                    'code' => $otpCode,
                    'expires_at' => now()->addMinutes(5),
                ]
            );

            // Try sending SMS
            $this->sendSmsOnly($request->phone, $otpCode);

            // Success → redirect to OTP verify form
            return redirect()
                ->route('otp.verify.form')
                ->with('phone', $request->phone);
        } catch (\Throwable $e) {
            // Log error for debugging
            \Log::error("OTP send failed: " . $e->getMessage(), [
                'phone' => $request->phone ?? null,
            ]);

            // Redirect back with error message
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => 'Failed to send OTP. Please try again.']);
        }
    }

    public function showVerifyForm()
    {
        return inertia('Auth/VerifyOtp');
    }

    public function verifyOneTimePassword(Request $request)
    {
        $otp = Otp::where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return back()->withErrors(['code' => 'Invalid or expired OTP']);
        }

        Auth::guard('otp')->login($otp);

        return redirect()->route('dashboard');
    }

    public function logout(Request $request)
    {
        Auth::guard('otp')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('home');
    }
}
