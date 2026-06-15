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
    | Use NG_* variables in .env. Same variable names in dev and production;
    | credentials (values) come from each environment's .env file.
    |
    */
    'ng' => [
        'endpoint' => env('NG_ENDPOINT'),
        'access_user' => env('NG_ACCESS_USER', 'PortalFixedService'),
        'access_pwd' => env('NG_ACCESS_PWD'),
        'channel_id' => env('NG_CHANNEL_ID', '116'),
        'technical_channel_id' => env('NG_TECHNICAL_CHANNEL_ID', '53'),
        'tenant_id' => env('NG_TENANT_ID', '101'),
        'language' => env('NG_LANGUAGE', '2002'),
        'version' => env('NG_VERSION', '1'),
        'operator_id' => env('NG_OPERATOR_ID', '53'),
    ],

    'ecaf' => [
        'endpoint' => env('ECAF_ENDPOINT'),
        'api_username' => env('ECAF_API_USERNAME'),
        'api_password' => env('ECAF_API_PASSWORD'),
        'agent_username' => env('ECAF_AGENT_USERNAME'),
        'channel_id' => env('ECAF_CHANNEL_ID', 57),
        'cust_type' => env('ECAF_CUST_TYPE', 1),
        'calendar_type' => env('ECAF_CALENDAR_TYPE', 0),
        'id_expiry_date' => now()->addYears(5)->format('Y-m-d\TH:i:s.vP'),
        'door_to_door' => env('ECAF_DOOR_TO_DOOR', false),
        'delegate' => env('ECAF_DELEGATE', true),
        'function' => env('ECAF_FUNCTION', 1),
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
        'maps_frontend_key' => env('GOOGLE_MAPS_FRONTEND_KEY'),
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
    | Get Combining Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the GetCombiningService which queries subscriber,
    | customer, and account information from FOSS OrderQuery.
    |
    */
    'get_combining' => [
        'endpoint' => env('GET_COMBINING_ENDPOINT'),
        'access_user' => env('GET_COMBINING_USER'),
        'access_pwd' => env('GET_COMBINING_PASSWORD'),
        'tenant_id' => env('GET_COMBINING_TENANT', '101'),
        'channel_id' => env('GET_COMBINING_CHANNEL', '116'),
        'technical_channel_id' => env('GET_COMBINING_TECHNICAL_CHANNEL_ID', '53'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Query Status Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for QuerySubscriptionOrderStatusService and QuerySurveyOrderService.
    | Used to query order status from BSS SELFCARE/HWBSS_Order endpoint.
    |
    */
    'order_query_status' => [
        'endpoint' => env('ORDER_QUERY_STATUS_ENDPOINT'),
        'access_user' => env('ORDER_QUERY_STATUS_ACCESS_USER', 'PortalFixedService'),
        'access_pwd' => env('ORDER_QUERY_STATUS_ACCESS_PWD'),
        'channel_id' => env('ORDER_QUERY_STATUS_CHANNEL_ID', '116'),
        'technical_channel_id' => env('ORDER_QUERY_STATUS_TECHNICAL_CHANNEL_ID', '53'),
        'tenant_id' => env('ORDER_QUERY_STATUS_TENANT_ID', '101'),
        'language' => env('ORDER_QUERY_STATUS_LANGUAGE', '2002'),
        'version' => env('ORDER_QUERY_STATUS_VERSION', '1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Query Purchased Primary Offering Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for QueryPurchasedOfferingService.
    | Used to query purchased primary offerings from BSS SELFCARE/HWBSS_Offering endpoint.
    |
    */
    'query_purchased_offering' => [
        'endpoint' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_ENDPOINT'),
        'access_user' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_ACCESS_USER', 'PortalFixedService'),
        'access_pwd' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_ACCESS_PWD'),
        'channel_id' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_CHANNEL_ID', '116'),
        'technical_channel_id' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_TECHNICAL_CHANNEL_ID', '53'),
        'tenant_id' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_TENANT_ID', '101'),
        'language' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_LANGUAGE', '2002'),
        'version' => env('ORDER_QUERY_PURCHASED_PRIMARY_OFFER_VERSION', '1'),
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
        'static_password' => env('INTERNET_STATIC_PASSWORD'),
        'encrypt_password' => env('INTERNET_ENCRYPT_PASSWORD', false),
        'password_length' => env('INTERNET_PASSWORD_LENGTH', 12),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google reCAPTCHA Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Google reCAPTCHA v2/v3 verification.
    | Used to protect public forms (like guest complaint submission) from bots.
    |
    | Get your keys from: https://www.google.com/recaptcha/admin
    |
    | Important:
    |   - site_key: Public key, exposed to frontend
    |   - secret_key: Private key, NEVER expose to frontend
    |
    */
    /*
    |--------------------------------------------------------------------------
    | Cloudflare Turnstile Configuration
    |--------------------------------------------------------------------------
    |
    | Set your Turnstile site and secret keys in your .env file:
    |   TURNSTILE_SITE_KEY=your-site-key
    |   TURNSTILE_SECRET_KEY=your-secret-key
    |
    | These are used for bot protection on public forms (e.g. complaints, registration).
    */
    'turnstile' => [
        'site_key' => env('TURNSTILE_SITE_KEY'),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
        // When true and APP_ENV=staging, skip server-side Cloudflare verify (for testing). Frontend still requires completing the widget.
        'skip_verification_in_staging' => env('TURNSTILE_SKIP_VERIFICATION_IN_STAGING', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Survey order duplicate validation bypass (e.g. app tests)
    |--------------------------------------------------------------------------
    | Customer codes in this list skip the "already have an active request"
    | duplicate check when creating a survey order. Set via .env:
    | SURVEY_BYPASS_DUPLICATE_CODES=CODE1,CODE2,CODE3
    */
    'survey_order' => [
        'bypass_duplicate_validation_customer_codes' => array_filter(
            array_map('trim', explode(',', env('SURVEY_BYPASS_DUPLICATE_CODES', '')))
        ),
    ],

];
