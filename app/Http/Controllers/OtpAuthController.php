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
        $request->validate(['phone' => 'required']);

        $otpCode = rand(100000, 999999);
        Otp::updateOrCreate(
            ['phone' => $request->phone],
            ['code' => $otpCode, 'expires_at' => Carbon::now()->addMinutes(5)]
        );
        // send SMS logic here...
        $this->sendSmsOnly($request->phone, $otpCode);

        return redirect()->route('otp.verify.form')->with('phone', $request->phone);
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
