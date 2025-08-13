<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'client/send-otp',
        'client/verify-otp',
        'client/login',
        'client/logout',
        // API routes
        'api/*',
        'client/*',

        // Authentication routes
        'login',
        'logout',
        'register',
        'password/*',

        // OTP routes
        'request-otp',
        'verify-otp',
        'resend-otp',

        // Webhook endpoints
        'stripe/webhook',
        'webhook/*',

        // Health check endpoint
        'health',

        // Add any other routes that need CSRF exemption
    ];
}