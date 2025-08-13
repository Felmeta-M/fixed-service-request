<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paths
    |--------------------------------------------------------------------------
    |
    | The URIs that should be accessible while bypassing CORS.
    |
    */
    'paths' => [
        'api/*',                // Your API routes
        'client/*',             // Client-specific routes
        'sanctum/csrf-cookie',  // For Laravel Sanctum CSRF protection
        'request-otp',          // Your OTP endpoint
        'login',                // Login endpoint if needed
        'logout',               // Logout endpoint
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    |
    | You can list allowed HTTP methods or use ['*'] to allow all.
    |
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Here you must explicitly list origins when using credentials.
    | Wildcard '*' will NOT work if supports_credentials is true.
    |
    */
    'allowed_origins' => [
        'http://127.0.0.1:8000', // If your frontend runs here
        'http://localhost:8000', // If you use localhost sometimes
        'http://localhost:3000', // Your frontend origin
        'http://localhost:5173', // Vite dev server
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns
    |--------------------------------------------------------------------------
    |
    | You may use patterns instead of full origins.
    |
    */
    'allowed_origins_patterns' => [],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | Headers that are allowed in the request.
    |
    */
    'allowed_headers' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | Headers that are allowed to be exposed to the browser.
    |
    */
    'exposed_headers' => [],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    |
    | This value controls how long the results of a preflight request
    | can be cached by the browser.
    |
    */
    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | This must be true when using cookies/sessions in cross-origin requests.
    |
    */
    'supports_credentials' => true,

];
