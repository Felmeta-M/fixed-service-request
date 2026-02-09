<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ValidateSignature;
use Symfony\Component\HttpFoundation\Response;

/**
 * Environment-aware signed URL validation.
 *
 * - Production: delegates to Laravel's ValidateSignature (enforces signed URLs)
 * - Dev/Local:  passes through without validation (no 403 on unsigned URLs)
 */
class ValidateSignedUrl
{
    public function handle(Request $request, Closure $next, ...$args): Response
    {
        if (app()->environment('production')) {
            return app(ValidateSignature::class)->handle($request, $next, ...$args);
        }

        return $next($request);
    }
}
