<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use App\Services\EsignetService;
use App\Services\LocalAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EsignetController extends Controller
{
    public function __construct(
        protected EsignetService $esignetService,
        protected LocalAuthService $localAuthService,
        protected CustomerService $customerService,
    ) {
    }

    /** Starts ESIGNET login */
    public function redirectToEsignet()
    {
        $result = $this->esignetService->buildAuthorizationUrl();

        if ($result['status'] !== 'ok') {
            logger()->error('Esignet Auth URL generation failed', [
                'error' => $result['message']
            ]);

            return Inertia::render('ErrorPage', [
                'message' => 'We are unable to start the login process at the moment. Please try again later.'
            ]);
        }

        session()->put('esignet', [
            'state' => $result['state'],
            'code_verifier' => $result['code_verifier'],
        ]);

        return redirect()->away($result['auth_url']);
    }


    public function handleEsignetCallback(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
        ]);

        $temp = session('esignet');

        if (!$temp) {
            logger()->warning('Esignet session missing on callback');

            return Inertia::render('ErrorPage', [
                'message' => 'Your login session has expired. Please start the login again.'
            ]);
        }

        if ($validated['state'] !== $temp['state']) {
            logger()->error('Esignet state mismatch', [
                'expected' => $temp['state'],
                'received' => $validated['state']
            ]);

            return Inertia::render('ErrorPage', [
                'message' => 'Security verification failed. Please try logging in again.'
            ]);
        }

        $token = $this->esignetService->exchangeCodeForToken(
            $validated['code'],
            $temp['code_verifier']
        );

        Log::info('Esignet token exchange result', [
            'token' => $token
        ]);

        if ($token['status'] !== 'ok') {
            logger()->error('Esignet token exchange failed', [
                'error' => $token['message']
            ]);

            return Inertia::render('ErrorPage', [
                'message' => 'We were unable to verify your login request. Please try again.'
            ]);
        }

        session()->forget('esignet');

        $result = $this->esignetService->getUserInfo($token['token']['access_token']);

        if ($result['status'] !== 'ok') {
            logger()->error('Esignet user info fetch failed', [
                'result' => $result,
                'error' => $result['message']
            ]);

            return Inertia::render('ErrorPage', [
                'message' => $result['message']
            ]);
        }

        $esignetUser = $result['customer'];

        $data = [
            'name' => $esignetUser['name'],
            'phone_number' => substr($esignetUser->phone_number, -9),
            'email' => $esignetUser?->email,
            'customer_code' => $esignetUser?->code ?? null,
            'customer_sub_id' => $esignetUser->sub,
        ];

        $user = $this->localAuthService->resolveUserForAuth($data);

        Auth::guard('otp')->login($user);

        session()->forget(['esign_state', 'esign_code_verifier']);


        Log::info('esignetUser', [
            'exists' => (bool) $esignetUser,
            'verified_at' => $esignetUser?->verified_at,
        ]);

        if ($esignetUser !== null && $esignetUser->verified_at !== null) {
            return redirect()->route('services');
        }

        return redirect()->route('services.create')->with([
            'error' => 'Your profile is incomplete. Please update it.',
            'prefill' => new CustomerResource(
                $this->customerService->getLocalCustomerData($user->customer_sub_id)
            ),
        ]);


    }


    /** Handle result from LocalAuthService */
    private function respondToLocalAuthResult(array $result)
    {
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

    private function finishLogin(array $data)
    {
        return redirect()->route('services')->with([
            'customer' => new CustomerResource($data),
        ]);
    }
}
