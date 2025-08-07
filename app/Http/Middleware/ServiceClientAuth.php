<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ServiceClientAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Missing or invalid token'], 401);
        }

        $plainToken = substr($header, 7);
        $hashed = hash('sha256', $plainToken);

        $token = PersonalAccessToken::where('token', $hashed)->first();

        if (! $token || $token->tokenable_type !== \App\Models\ServiceClient::class) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        Auth::guard('service_client')->setUser($token->tokenable);

        return $next($request);
    }
}
