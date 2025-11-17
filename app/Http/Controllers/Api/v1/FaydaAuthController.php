<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\FaydaAuthService;
use Illuminate\Http\Request;

class FaydaAuthController extends Controller
{
    private FaydaAuthService $service;

    public function __construct(FaydaAuthService $service)
    {
        $this->service = $service;
    }

    /**
     * Begin OAuth Flow: returns URL + PKCE
     */
    public function start()
    {
        $codeVerifier = $this->service->generateCodeVerifier();
        $codeChallenge = $this->service->generateCodeChallenge($codeVerifier);
        $state = $this->service->generateState();

        $authUrl = $this->service->authorizationUrl($state, $codeChallenge);

        return response()->json([
            'auth_url' => $authUrl,
            'state' => $state,
            'code_verifier' => $codeVerifier,
        ]);
    }

    /**
     * Callback: exchange code → tokens → userinfo
     */
    public function callback(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'state' => 'required|string',
            'code_verifier' => 'required|string',
        ]);

        $tokens = $this->service->exchangeCode(
            $request->code,
            $request->code_verifier
        );

        $userInfo = $this->service->userInfo($tokens['access_token']);

        return response()->json([
            'tokens' => $tokens,
            'user' => $userInfo,
        ]);
    }
}
