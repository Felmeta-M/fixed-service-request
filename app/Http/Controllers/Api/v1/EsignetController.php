<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\EsignetService;
use App\Services\LocalAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EsignetController extends Controller
{
    public function __construct(
        protected EsignetService   $esignet,
        protected LocalAuthService $localAuth
    )
    {
    }

    /** Starts ESIGNET login */
    public function redirectToEsignet()
    {
        $result = $this->esignet->buildAuthorizationUrl();

        if ($result['status'] !== 'ok') {
            return Inertia::render('ErrorPage', [
                'message' => $result['message']
            ]);
        }

        session([
            'esign_state' => $result['state'],
            'esign_code_verifier' => $result['code_verifier'],
        ]);

        return redirect()->away($result['auth_url']);
    }

    /** Callback handler */
    public function handleEsignetCallback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
        ]);

        if ($request->state !== session('esign_state')) {
            return Inertia::render('ErrorPage', [
                'message' => 'Invalid login session (state mismatch).'
            ]);
        }

        $verifier = session('esign_code_verifier');

        // 1. Exchange token
        $token = $this->esignet->exchangeCodeForToken($request->code, $verifier);
        if ($token['status'] !== 'ok') {
            return Inertia::render('ErrorPage', [
                'message' => $token['message']
            ]);
        }

        // 2. Fetch user info
        $user = $this->esignet->getUserInfo($token['token']['access_token']);
        if ($user['status'] !== 'ok') {
            return Inertia::render('ErrorPage', [
                'message' => $user['message']
            ]);
        }

        // 3. Local auth validation + CRM sync
        $local = $this->localAuth->handle($user['phone']);

        return $this->respondToLocalAuthResult($local);
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

    /** Final login */
    private function finishLogin(array $data)
    {
        $user = $this->localAuth->resolveUserForAuth($data);
        Auth::guard('otp')->login($user);

        session()->forget(['esign_state', 'esign_code_verifier']);

        return redirect()->route('dashboard');
    }
}
