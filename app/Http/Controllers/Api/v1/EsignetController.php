<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Auth\ClientAuthController;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\EsignetService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EsignetController extends Controller
{
    public function __construct(
        protected EsignetService $esign,
        protected ClientAuthController $client_auth_controller
    ) {}

    /**
     * Redirect to ESIGNET login page
     */
    public function redirectToEsignet()
    {
        try {
            $authData = $this->esign->buildAuthorizationUrl();

            if (isset($authData['error'])) {
                Log::error("Failed building authorization URL", $authData);
                return response()->json([
                    'error' => 'Failed to initiate authentication'
                ], 500);
            }

            session([
                'esignet_code_verifier' => $authData['codeVerifier'],
                'esignet_state'         => $authData['state'],
            ]);

            // Log::info("Stored PKCE verifier & state in session");

            return response()->json($authData);
        } catch (\Throwable $e) {
            Log::error("Exception in redirectToEsignet", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Unexpected error initializing authentication'
            ], 500);
        }
    }


    /**
     * Handle callback from ESIGNET
     */
    public function handleEsignetCallback(Request $request)
    {
        // Log::info("EsignetController::handleEsignetCallback - Start", [
        //     'query' => $request->all()
        // ]);

        try {
            $request->validate([
                'code'  => 'required|string',
                'state' => 'required|string',
            ]);
        } catch (\Throwable $e) {
            Log::warning("Validation failed", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Missing or invalid parameters'
            ], 422);
        }

        try {
            $codeVerifier = session('esignet_code_verifier');
            $stateSaved   = session('esignet_state');

            // Log::info("Loaded stored session PKCE params", [
            //     'stored_verifier' => $codeVerifier,
            //     'stored_state'    => $stateSaved
            // ]);

            if (!$codeVerifier || !$stateSaved) {
                Log::error("Session expired or missing");
                return response()->json([
                    'error' => 'Session expired. Restart login.'
                ], 440);
            }

            if ($request->state !== $stateSaved) {
                Log::error("State mismatch", [
                    'received' => $request->state,
                    'expected' => $stateSaved
                ]);
                return response()->json([
                    'error' => 'Invalid state parameter'
                ], 403);
            }
        } catch (\Throwable $e) {
            Log::error("Failed reading session data", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Session error'
            ], 500);
        }


        /**
         * Exchange code for token
         */
        try {
            $tokenResponse = $this->esign->exchangeCodeForToken($request->code, $codeVerifier);

            if (!isset($tokenResponse['access_token'])) {
                Log::error("Token exchange failed", [
                    'response' => $tokenResponse
                ]);

                return response()->json([
                    'error' => 'Failed to obtain access token',
                    'details' => $tokenResponse
                ], 400);
            }

            // Log::info("Token successfully received", [$tokenResponse]);
        } catch (\Throwable $e) {
            Log::error("Exception exchanging code for token", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Token request failed'
            ], 500);
        }


        /**
         * Get User Info
         */
        try {
            $customer = $this->esign->getUserInfo($tokenResponse['access_token']);

            Auth::guard('otp')->loginUsingId($customer->id);

            return redirect()->route('dashboard');
        } catch (\Throwable $e) {
            Log::error("Exception fetching user info", [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed contacting userinfo endpoint'
            ], 500);
        }


        /**
         * Cleanup & return success
         */
        session()->forget(['esignet_code_verifier', 'esignet_state']);
        // Log::info("Session cleaned");
    }
}
