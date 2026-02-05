<?php

/**
 * Ziggy Configuration
 * 
 * This configuration limits which routes are exposed to the frontend JavaScript.
 * By default, Ziggy exposes ALL routes which is a security concern.
 * 
 * SECURITY: Only expose routes that the frontend actually needs.
 * 
 * @see https://github.com/tighten/ziggy#filtering-routes
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Only Include Specific Routes
    |--------------------------------------------------------------------------
    |
    | Routes matching these patterns will be exposed to the frontend.
    | This is the safest approach - explicitly whitelist what you need.
    |
    | IMPORTANT: Review and update this list when adding new frontend routes.
    |
    | Note: Use either 'only' OR 'except', not both together.
    |
    */
    'only' => [
        // Public pages
        'home',
        'terms',
        'complaint',
        'dashboard',

        // Authentication (OTP-based)
        'otp.phone',
        'otp.send',
        'otp.verify',
        'otp.verify.form',
        'login',
        'register',
        'logout',

        // Password management
        'password.request',
        'password.email',
        'password.confirm',
        'password.update',
        'password.store',

        // Email verification
        'verification.send',

        // Services (main customer-facing)
        'services',
        'services.create',
        'services.show',
        'services.manual-create',
        'services.subscription-success',

        // Complaints/TT
        'complaints',
        'complaints.index',
        'complaints.create',
        'complaints.show',

        // Profile & Settings
        'profile',
        'profile.edit',
        'profile.update',
        'profile.destroy',

        // Customer management
        'customers.create',
        'customers.store',

        // Subscriber routes
        'subscribers.index',
        'subscribers.create',
        'subscribers.store',
        'subscribers.show',
        'subscribers.edit',
        'subscribers.update',
        'subscribers.destroy',

        // Survey requests
        'survey-requests.index',
        'survey-requests.create',
        'survey-requests.store',
        'survey-requests.show',
        'survey-requests.edit',
        'survey-requests.update',
        'survey-requests.destroy',

        // Resource checks
        'resource-checks.index',
        'resource-checks.create',
        'resource-checks.store',
        'resource-checks.show',
        'resource-checks.edit',
        'resource-checks.update',

        // Payment
        'payment.summary',
        'payment.success',
    ],
];
