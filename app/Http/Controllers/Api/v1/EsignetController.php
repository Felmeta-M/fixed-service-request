<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\EsignetService;

class EsignetController extends Controller
{
    protected EsignetService $esign;

    public function __construct(EsignetService $esign)
    {
        $this->esign = $esign;
    }

    /**
     * Redirect to ESIGNET login page
     */
    public function redirectToEsignet()
    {
        $authData = $this->esign->buildAuthorizationUrl();

        session([
            'esignet_code_verifier' => $authData['codeVerifier'],
            'esignet_state'         => $authData['state'],
        ]);

        return $authData;
    }

    /**
     * Handle callback from ESIGNET
     */
    public function handleEsignetCallback(Request $request)
    {
        $request->validate([
            'code'  => 'required|string',
            'state' => 'required|string',
        ]);

        $codeVerifier = session('esignet_code_verifier');
        $stateSaved   = session('esignet_state');

        if ($request->state !== $stateSaved) {
            abort(403, 'Invalid state');
        }

        $tokenResponse = $this->esign->exchangeCodeForToken($request->code, $codeVerifier);
        $userInfo = $this->esign->getUserInfo($tokenResponse['access_token']);

        // Optionally clear the session
        session()->forget(['esignet_code_verifier', 'esignet_state']);

        return redirect('/login')->with([
            'user'  => $userInfo,
            'token' => $tokenResponse,
        ]);
    }
}
