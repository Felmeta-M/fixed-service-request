<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use App\Services\LocalAuthService;
use App\Services\QueryCustomerByServiceNumberService;
use App\Traits\InteractsWithSMSGateway;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Log;
use Throwable;

class OtpAuthController extends Controller
{
    use InteractsWithSMSGateway;

    public function __construct(
        protected QueryCustomerByServiceNumberService $queryCustomerByService,
        protected LocalAuthService                    $localAuthService
    ) {}

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
            $phoneNumber = substr($request->get('phone'), -9);
            if (!preg_match('/^(?:\+2519|2519|09|9)\d{8}$/', $phoneNumber)) {
                return response()->json([
                    'errors' => [
                        'phone' => ['Phone number must be Ethio Telecom.'],
                    ],
                ], 422);
            }

            $otpCode = rand(100000, 999999);
            Log::info('Generated OTP code: ' . $otpCode);

            Otp::updateOrCreate(
                ['phone_number' => $phoneNumber],
                [
                    'code' => $otpCode,
                    'expires_at' => now()->addMinutes(10),
                ]
            );
            Log::info("OTP stored for {$phoneNumber}: {$otpCode}");

            // Try sending SMS
            $this->sendSmsOnly($phoneNumber, $otpCode);
            Log::info("OTP sent to {$phoneNumber}: {$otpCode}");
            return redirect()
                ->route('otp.verify.form')
                ->with('phone', $request->get('phone'));
        } catch (Throwable $e) {
            Log::error('message: ' . $e->getMessage() . ' Line: ' . $e->getLine());
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => 'Failed to send OTP. Please try again.']);
        }
    }

    public function showVerifyForm()
    {
        $phone = session('phone');
        return Inertia::render('Auth/VerifyOtp', [
            'phone' => $phone,
        ]);
    }

    public function verifyOneTimePassword(Request $request)
    {
        $otp = Otp::where('code', $request->code)
            ->where('expires_at', '>=', Carbon::now())
            ->first();
        Log::info($otp);
        if (!$otp) {
            return back()->withErrors(['code' => 'Invalid or expired OTP']);
        }

        $crmCustomer = $this->queryCustomer($otp?->phone_number);
        Log::info('crmCustomer', [$crmCustomer['code']]);
        $data = [
            'name' => $crmCustomer['first_name'] . '' . $crmCustomer['last_name'] ?? 'test...',
            'phone_number' => $crmCustomer['phone_number'] ?? $otp->phone_number,
            'email' => $crmCustomer['email'] ?? 'test@example.com',
            'customer_code' => $crmCustomer['code'] ?? '124426'
        ];

        $user = $this->localAuthService->resolveUserForAuth($data);

        Auth::guard('otp')->login($user);

        return redirect()->route('services');
    }

    protected function queryCustomer(?string $phoneNumber)
    {

        if (!$phoneNumber || !preg_match('/^(09|9|\+2519)/', $phoneNumber)) {
            return [];
        }

        $response = $this->queryCustomerByService->getCustomer('123555754');
        // Log::info('test', [$response]);

        $response = json_decode($response->getContent(), true);
        if (
            empty($response['success']) ||
            empty($response['data']['customer'])
        ) {
            return [];
        }

        return $response['data']['customer'];
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('otp')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
