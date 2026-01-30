<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'api_sec' => [
        'timeout' => 15,
        'max_retries' => 3,
        'rate_limit' => 5,   // requests per second
        'decay_seconds' => 60,
    ],

    'national_id_secret_key' => env('NATIONAL_ID_SECRET_KEY'),

    'sms_endpoint' => env('SMS_ENDPOINT'),

    /*
    |--------------------------------------------------------------------------
    | Unified BSS ECAF Configuration (NG)
    |--------------------------------------------------------------------------
    |
    | Single configuration for all BSS ECAF services. All survey, subscription,
    | customer, and offer services use these common parameters.
    |
    */
    'ng' => [
        'endpoint' => env('NG_ENDPOINT'),
        'access_user' => env('NG_ACCESS_USER', 'PortalFixedService'),
        'access_pwd' => env('NG_ACCESS_PWD'),
        'channel_id' => env('NG_CHANNEL_ID', '61'),
        'technical_channel_id' => env('NG_TECHNICAL_CHANNEL_ID', 'PortalFixedService'),
        'tenant_id' => env('NG_TENANT_ID', '101'),
        'language' => env('NG_LANGUAGE', '2002'),
        'version' => env('NG_VERSION', '1'),
    ],

    'ecaf' => [
        'endpoint' => env('ECAF_ENDPOINT'),
        'api_username' => 'HW_LOADER',
        'api_password' => 'REDACTED_PASSWORD',
        'agent_username' => 'RIDE_9XXYYYYYY',
        'channel_id' => 57,
        'cust_type' => 1,
        'calendar_type' => 0,
        'id_expiry_date' => now()->addYears(5)->format('Y-m-d\TH:i:s.vP'),
        'door_to_door' => false,
        'delegate' => true,
        'function' => 1,
    ],


    // Resource check service - uses different endpoint (ZTE OSS)
    'check_resource' => [
        'endpoint' => env('CHECK_RESOURCE_ENDPOINT'),
        'access_user' => env('CHECK_RESOURCE_ACCESS_USER'),
        'access_pwd' => env('CHECK_RESOURCE_ACCESS_PASSWORD'),
        'channel_id' => env('CHECK_RESOURCE_CHANNEL_ID'),
        'technical_channel_id' => env('CHECK_RESOURCE_TECHNICAL_CHANNEL_ID'),
        'staff_name' => env('CHECK_RESOURCE_STAFF_NAME', 'superadmin'),
        'staff_code' => env('CHECK_RESOURCE_STAFF_CODE', '1'),
    ],

    'otp' => [
        'endpoint' => env('NID_ENDPOINT'),
        'access_user' => env('NID_ACCESS_USER', 'ecaf'),
        'access_password' => env('NID_ACCESS_PASSWORD'),
        'operator_id' => env('NID_OPERATOR_ID', '512'),
        'tenant_id' => env('NID_TENANT_ID', '101'),
        'channel' => env('NID_CHANNEL', '35'),
        'language' => env('NID_LANGUAGE', '2002'),
        'id' => env('NID_CLIENT_ID', 'ethiotel'),
        'client_secret' => env('NID_CLIENT_SECRET'),
        'env' => env('NID_ENV', 'prod'),
        'domain_uri' => env('NID_DOMAIN_URI', 'fayda.et'),
        'individual_id_type' => env('NID_INDIVIDUAL_ID_TYPE', 'FCN'),
        'otp_channel' => env('NID_OTP_CHANNEL', 'phone'),
    ],

    'kyc' => [
        'endpoint' => env('NID_ENDPOINT'),
        'access_user' => env('NID_ACCESS_USER', 'ecaf'),
        'access_password' => env('NID_ACCESS_PASSWORD'),
        'operator_id' => env('NID_OPERATOR_ID', '512'),
        'channel' => env('NID_CHANNEL', '35'),
        'version' => env('NID_VERSION', '1'),
        'env' => env('NID_ENV', 'prod'),
        'domain_uri' => env('NID_DOMAIN_URI', 'fayda.et'),
        'client_id' => env('NID_CLIENT_ID', 'ethiotel'),
        'client_secret' => env('NID_CLIENT_SECRET'),
        'individual_id_type' => env('NID_INDIVIDUAL_ID_TYPE', 'FCN'),
    ],

    'telebirr' => [
        'base_url' => env('TELEBIRR_BASE_URL'),
        'web_base_url' => env('WEB_TELEBIRR_BASE_URL'),
        'fabric_app_id' => env('TELEBIRR_APP_ID'),
        'app_secret' => env('TELEBIRR_APP_SECRET'),
        'merchant_app_id' => env('TELEBIRR_MERCHANT_APP_ID'),
        'merchant_code' => env('TELEBIRR_MERCHANT_CODE'),
        "private_key" => env('TELEBIRR_PRIVATE_KEY'),
        'notify_url' => env("NOTIFY_URL")
    ],

    'esignet' => [
        'client_id' => env('FAYDA_CLIENT_ID'),
        'redirect_uri' => env('FAYDA_REDIRECT_URI'),
        'authorization_endpoint' => env('FAYDA_AUTH_URL'),
        'token_endpoint' => env('FAYDA_TOKEN_URL'),
        'userinfo_endpoint' => env('FAYDA_USERINFO_URL'),
        'client_assertion_type' => env('FAYDA_ASSERTION_TYPE'),
        'private_key' => env('FAYDA_PRIVATE_KEY'),
        'expiration_time' => env('FAYDA_EXPIRATION_TIME', 15),
        'algorithm' => env('FAYDA_ALG', 'RS256'),
    ],

    'google' => [
        // Server-side only key (for Geocoding API, etc.) - NEVER expose to frontend
        'google_api_key' => env('GOOGLE_API_KEY'),
        'maps_server_key' => env('GOOGLE_MAPS_SERVER_KEY'),
        // Frontend key - MUST be restricted in Google Cloud Console:
        // 1. Application restrictions: HTTP referrers (your domain only)
        // 2. API restrictions: Maps JavaScript API only
        'maps_frontend_key' => env('GOOGLE_MAPS_FRONTEND_KEY', ''),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    ],

    'tt' => [
        'endpoint' => env('TT_ENDPOINT'),
        'timeout' => 30,
        'username' => env('TT_USERNAME'),
        'password' => env('TT_PASSWORD'),
    ],


    /*
    |--------------------------------------------------------------------------
    | Internet Credentials Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for generating internet account credentials for Data and
    | Combo subscription services. These credentials are used by customers
    | to configure their end devices (routers/modems).
    |
    | Username Patterns:
    |   - 'random': Random 8-char alphanumeric (default)
    |   - 'phone': Based on customer phone (prefix + last 6 digits + random)
    |   - 'uuid': UUID-based username
    |   - 'timestamp': Timestamp-based (YmdHis + random)
    |   - 'customer_code': Based on customer code
    |
    */
    'internet_credentials' => [
        // Username generation
        'username_pattern' => env('INTERNET_USERNAME_PATTERN', 'timestamp'),
        'username_prefix' => env('INTERNET_USERNAME_PREFIX', 'fbb'),
        'email_domain' => env('INTERNET_EMAIL_DOMAIN', 'ethiotelecom.et'),

        // Password generation
        // If static_password is set, it will be used; otherwise generates random
        'static_password' => env('INTERNET_STATIC_PASSWORD', 'REDACTED_PASSWORD'),
        'encrypt_password' => env('INTERNET_ENCRYPT_PASSWORD', false),
        'password_length' => env('INTERNET_PASSWORD_LENGTH', 12),
    ],


];
