<?php

namespace App\Http\Controllers;

use App\Exceptions\AuthenticationException;
use App\Models\Otp;
use App\Services\ApiResponse;
use App\Services\LocalAuthService;
use App\Services\Logging\AppLogger;
use App\Services\QueryCustomerByServiceNumberService;
use App\Services\Security\DataSanitizer;
use App\Services\Security\SecureOtpService;
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

    public function __construct(
        protected QueryCustomerByServiceNumberService $queryCustomerByService,
        protected LocalAuthService $localAuthService,
        protected SecureOtpService $secureOtpService
    ) {}

    public function showPhoneForm()
    {
        return inertia('Auth/EnterPhone');
    }

    /**
     * Send OTP - Secure implementation
     */
    public function sendOneTimePassword(Request $request)
    {
        try {
            $request->validate([
                'phone' => 'required|string',
            ]);

            $phoneNumber = $this->normalizePhone($request->get('phone'));

            // Validate Ethiopian phone number format
            if (!$this->isValidEthiopianPhone($phoneNumber)) {
                return response()->json([
                    'errors' => [
                        'phone' => ['Phone number must be a valid Ethio Telecom number.'],
                    ],
                ], 422);
            }

            // Generate secure OTP (hashed storage, rate limited)
            $result = $this->secureOtpService->generate($phoneNumber, $request->ip());

            // Send OTP via SMS (OTP is only returned here, never logged)
            $this->sendSmsOnly($phoneNumber, "Your verification code is {$result['otp']}. It expires in 5 minutes.");

            // Log without sensitive data
            AppLogger::auth()->info('OTP sent successfully', [
                'phone_masked' => DataSanitizer::maskPhone($phoneNumber),
                'ip' => $request->ip(),
            ]);

            return redirect()
                ->route('otp.verify.form')
                ->with('phone', $request->get('phone'));

        } catch (AuthenticationException $e) {
            // Rate limit or lockout
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['otp' => $e->getUserMessage()]);

        } catch (Throwable $e) {
            AppLogger::auth()->error('OTP send failed', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);

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

    /**
     * Verify OTP - Secure implementation
     */
    public function verifyOneTimePassword(Request $request)
    {
        try {
            $request->validate([
                'code' => 'required|string|size:6',
            ]);

            $phone = session('phone') ?? $request->get('phone');
            $phoneNumber = $this->normalizePhone($phone);
            $code = $request->get('code');

            // Verify OTP (handles brute force protection)
            if (!$this->secureOtpService->verify($phoneNumber, $code, $request->ip())) {
                return back()->withErrors(['code' => 'Invalid or expired OTP']);
            }

            // OTP verified - fetch customer data
            $crmCustomer = $this->queryCustomer($phoneNumber);

            $data = [
                'name' => trim(($crmCustomer['first_name'] ?? '') . ' ' . ($crmCustomer['last_name'] ?? '')) ?: 'User',
                'phone_number' => $crmCustomer['phone_number'] ?? $phoneNumber,
                'email' => $crmCustomer['email'] ?? null,
                'customer_code' => $crmCustomer['code'] ?? null,
            ];

            $user = $this->localAuthService->resolveUserForAuth($data);

            // Regenerate session for security
            $request->session()->regenerate();

            Auth::guard('otp')->login($user);

            AppLogger::auth()->info('User authenticated via OTP', [
                'user_id' => $user->id,
                'phone_masked' => DataSanitizer::maskPhone($phoneNumber),
                'ip' => $request->ip(),
            ]);

            return redirect()->route('services');

        } catch (AuthenticationException $e) {
            return back()->withErrors(['code' => $e->getUserMessage()]);

        } catch (Throwable $e) {
            AppLogger::auth()->error('OTP verification error', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);

            return back()->withErrors(['code' => 'Verification failed. Please try again.']);
        }
    }

    /**
     * Normalize phone number to 9-digit format
     */
    protected function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);
        return substr($phone, -9);
    }

    /**
     * Validate Ethiopian phone number
     */
    protected function isValidEthiopianPhone(string $phone): bool
    {
        // Must be 9 digits starting with 7 or 9
        return preg_match('/^[79]\d{8}$/', $phone) === 1;
    }

    /**
     * Query customer from CRM
     */
    protected function queryCustomer(?string $phoneNumber): array
    {
        if (!$phoneNumber) {
            return [];
        }

        try {
            $response = $this->queryCustomerByService->getCustomer('123555754');
            $response = json_decode($response->getContent(), true);

            if (empty($response['success']) || empty($response['data']['customer'])) {
                return [];
            }

            return $response['data']['customer'];
        } catch (Throwable $e) {
            AppLogger::api()->warning('Customer query failed', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Logout with proper session invalidation
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('otp')->logout();

        // Security: Invalidate session and regenerate token
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        AppLogger::auth()->info('User logged out', [
            'ip' => $request->ip(),
        ]);

        return redirect()->route('home');
    }
}
