<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Auth;

class AuthenticateServiceClient
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Bearer token missing'], 401);
        }

        // PersonalAccessToken resolves token and loads tokenable
        $accessToken = PersonalAccessToken::findToken($token);

        if (! $accessToken || ! $accessToken->tokenable) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Optional: Check scopes/abilities/expirations
        // if (! $accessToken->can('service:read')) {
        //     return response()->json(['message' => 'Forbidden'], 403);
        // }

        // Authenticate the service client
        Auth::setUser($accessToken->tokenable);

        return $next($request);
    }
}
