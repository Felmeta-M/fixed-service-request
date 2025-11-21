<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use App\Services\LocalAuthService;
use App\Traits\InteractsWithSMSGateway;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
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
            \Log::info('Sending OTP to phone: ' . $request->phone);
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
            \Log::info('Generated OTP code: ' . $otpCode);

            Otp::updateOrCreate(
                ['phone' => $phone],
                [
                    'code' => $otpCode,
                    'expires_at' => now()->addMinutes(10),
                ]
            );
            \Log::info("OTP stored for {$phone}: {$otpCode}");

            // Try sending SMS
            $this->sendSmsOnly($phone, $otpCode);
            \Log::info("OTP sent to {$phone}: {$otpCode}");

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
        \Log::info('Showing OTP verify form for phone: ' . session('phone'));
        $phone = session('phone');
        return Inertia::render('Auth/VerifyOtp', [
            'phone' => $phone,
        ]);
    }

    public function verifyOneTimePassword(Request $request)
    {
        $otp = Otp::where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return back()->withErrors(['code' => 'Invalid or expired OTP']);
        }


        // Auth::guard('otp')->loginUsingId($otp->id);

        // return redirect()->route('dashboard');

        $local = $this->localAuthService->handle($otp->phone);

        return $this->respondToLocalAuthResult($local);
    }

    /** Handle result from LocalAuthService */
    private function respondToLocalAuthResult(array $result)
    {
        \Log::info('Responding to local auth result: ' . json_encode($result));
        return match ($result['status']) {

            'under_age' =>
            Inertia::render('ErrorPage', [
                'message' => 'You must be 18 or older to use this service.'
            ]),

            'invalid_phone' =>
            redirect()->route('customer.create')->with([
                'error' => 'Phone number must be Ethio Telecom (09 or +2519).',
                'prefill' => $result['data'] ?? [],
            ]),

            'incomplete' =>
            redirect()->route('customer.create')->with([
                'error' => 'Your profile is incomplete. Please update it.',
                'prefill' => $result['data'] ?? [],
            ]),

            'not_found' =>
            redirect()->route('customer.create')->with([
                'error' => 'Your phone number could not be found in our system.',
            ]),

            'ok' => $this->finishLogin($result['data']),

            default =>
            Inertia::render('ErrorPage', [
                'message' => 'Unknown authentication error.'
            ]),
        };
    }

    /** Final login */
    private function finishLogin(array $data): RedirectResponse
    {
        \Log::info('Finishing login for user data: ' . json_encode($data));
        $user = $this->localAuthService->resolveUserForAuth($data);
        Auth::guard('otp')->login($user);
        \Log::info('User logged in via OTP: ' . $user->id);

        return redirect()->route('services');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('otp')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
