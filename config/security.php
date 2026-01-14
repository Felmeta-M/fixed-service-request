<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains security-related configuration options for the
    | application including CSP, rate limiting, and authentication settings.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    */

    'csp' => [
        'enabled' => env('SECURITY_CSP_ENABLED', true),
        'report_uri' => env('SECURITY_CSP_REPORT_URI'),
        'report_only' => env('SECURITY_CSP_REPORT_ONLY', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Strict Transport Security (HSTS)
    |--------------------------------------------------------------------------
    */

    'hsts' => [
        'enabled' => env('SECURITY_HSTS_ENABLED', true),
        'max_age' => env('SECURITY_HSTS_MAX_AGE', 31536000), // 1 year
        'include_subdomains' => env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', true),
        'preload' => env('SECURITY_HSTS_PRELOAD', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | OTP Configuration
    |--------------------------------------------------------------------------
    */

    'otp' => [
        'length' => env('SECURITY_OTP_LENGTH', 6),
        'expiry_minutes' => env('SECURITY_OTP_EXPIRY', 5),
        'max_attempts' => env('SECURITY_OTP_MAX_ATTEMPTS', 3),
        'lockout_minutes' => env('SECURITY_OTP_LOCKOUT', 15),
        'rate_limit_per_phone' => env('SECURITY_OTP_RATE_PHONE', 3), // per 5 minutes
        'rate_limit_per_ip' => env('SECURITY_OTP_RATE_IP', 5), // per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | API Rate Limiting
    |--------------------------------------------------------------------------
    */

    'rate_limits' => [
        'public' => [
            'requests' => env('RATE_LIMIT_PUBLIC', 60),
            'period' => 60,
        ],
        'authenticated' => [
            'requests' => env('RATE_LIMIT_AUTHENTICATED', 120),
            'period' => 60,
        ],
        'sensitive' => [
            'requests' => env('RATE_LIMIT_SENSITIVE', 10),
            'period' => 60,
        ],
        'auth' => [
            'requests' => env('RATE_LIMIT_AUTH', 5),
            'period' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Security
    |--------------------------------------------------------------------------
    */

    'session' => [
        'regenerate_on_login' => true,
        'invalidate_on_logout' => true,
        'single_device' => env('SECURITY_SINGLE_DEVICE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Policy
    |--------------------------------------------------------------------------
    */

    'password' => [
        'min_length' => env('SECURITY_PASSWORD_MIN_LENGTH', 8),
        'require_uppercase' => env('SECURITY_PASSWORD_UPPERCASE', true),
        'require_lowercase' => env('SECURITY_PASSWORD_LOWERCASE', true),
        'require_numbers' => env('SECURITY_PASSWORD_NUMBERS', true),
        'require_symbols' => env('SECURITY_PASSWORD_SYMBOLS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Security
    |--------------------------------------------------------------------------
    */

    'api' => [
        'token_expiry_days' => env('API_TOKEN_EXPIRY_DAYS', 30),
        'require_https' => env('API_REQUIRE_HTTPS', true),
        'allowed_origins' => explode(',', env('API_ALLOWED_ORIGINS', '*')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Security
    |--------------------------------------------------------------------------
    */

    'logging' => [
        'mask_sensitive_data' => true,
        'sensitive_keys' => [
            'password',
            'token',
            'secret',
            'api_key',
            'otp',
            'pin',
            'card_number',
            'cvv',
        ],
        'partial_mask_keys' => [
            'phone',
            'email',
            'customer_code',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Security
    |--------------------------------------------------------------------------
    */

    'uploads' => [
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        'max_size_mb' => env('UPLOAD_MAX_SIZE_MB', 10),
        'scan_for_malware' => env('UPLOAD_SCAN_MALWARE', false),
    ],

];
