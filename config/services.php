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

    'national_id_secret_key' => env('NATIONAL_ID_SECRET_KEY', 'REDACTED_SECRET_KEY'),

    'soap' => [
        'endpoint' => env('SOAP_URL'),
        'version' => env('SOAP_VERSION', 1),
        'language' => env('SOAP_LANGUAGE', '2002'),
        'channel_id' => env('SOAP_CHANNEL_ID', '64'),
        'technical_channel_id' => env('SOAP_TECHNICAL_CHANNEL_ID', '53'),
        'tenant_id' => env('SOAP_TENANT_ID', '101'),
        'access_user' => env('SOAP_ACCESS_USER'),
        'access_password' => env('SOAP_ACCESS_PASSWORD'),
    ],

    'customer' => [
        'access_user' => env('CUSTOMER_ACCESS_USER', 'kiosk'),
        'access_password' => env('CUSTOMER_ACCESS_PWD'),
        'channel_id' => env('CUSTOMER_CHANNEL_ID', '61'),
        'technical_channel_id' => env('CUSTOMER_TECH_CHANNEL_ID', '51'),
        'tenant_id' => env('CUSTOMER_TENANT_ID', '101'),
        'create_endpoint' => env('CUSTOMER_CREATE_ENDPOINT'),
        'query_endpoint' => env('CUSTOMER_QUERY_ENDPOINT'),
    ],

    'query_customer' => [
        'endpoint' => env('QUERY_CUSTOMER_URL'),
        'user' => env('QUERY_CUSTOMER_USER'),
        'password' => env('QUERY_CUSTOMER_PASS'),
    ],

    'query_customer_by_service_number' => [
        'endpoint' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_CUSTOMER_ENDPOINT'),
        'language' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_LANGUAGE'),
        'channel_id' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_CHANNEL_ID'),
        'technical_channel_id' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_TECH_CHANNEL_ID'),
        'access_user' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_ACCESS_USER'),
        'access_pwd' => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_ACCESS_PWD'),
    ],

    'survey' => [
        'endpoint' => env('SURVEY_BSS_ENDPOINT'),
        'access_user' => env('SURVEY_BSS_ACCESS_USER'),
        'access_password' => env('SURVEY_BSS_ACCESS_PASSWORD'),
        'channel_id' => env('SURVEY_BSS_CHANNEL_ID'),
        'technical_channel_id' => env('SURVEY_TECHNICAL_CHANNEL_ID'),
        'language' => env('SURVEY_BSS_LANGUAGE'),
        'tenant_id' => env('SURVEY_TENANT_ID'),
    ],

    'query_survey' => [
        'endpoint' => env('QUERY_SURVEY_ENDPOINT'),
        'channel_id' => env('QUERY_SURVEY_CHANNEL_ID'),
        'technical_channel_id' => env('QUERY_SURVEY_TECHNICAL_CHANNEL_ID'),
        'access_user' => env('QUERY_SURVEY_ACCESS_USER'),
        'access_pwd' => env('QUERY_SURVEY_ACCESS_PWD'),
    ],

    'cancel_survey' => [
        'endpoint' => env('CANCEL_SURVEY_ENDPOINT'),
        'channel_id' => env('CANCEL_SURVEY_CHANNEL_ID', '59'),
        'tech_channel_id' => env('CANCEL_SURVEY_TECH_CHANNEL_ID', '35'),
        'access_user' => env('CANCEL_SURVEY_USER', 'ecaf'),
        'access_pwd' => env('CANCEL_SURVEY_PASSWORD'),
    ],

    'query_survey_summery' => [
        'endpoint' => env('QUERY_SURVEY_SUMMERY_SOAP_ENDPOINT'),
        'channel_id' => env('QUERY_SURVEY_SUMMERY_CHANNEL_ID'),
        'technical_channel_id' => env('QUERY_SURVEY_SUMMERY_TECHNICAL_CHANNEL_ID'),
        'access_user' => env('QUERY_SURVEY_SUMMERY_ACCESS_USER'),
        'access_pwd' => env('QUERY_SURVEY_SUMMERY_ACCESS_PWD'),
    ],

    'subscriber' => [
        'endpoint' => env('SUBSCRIBER_BSS_ENDPOINT'),
        'access_user' => env('SUBSCRIBER_BSS_USERNAME'),
        'access_pwd' => env('SUBSCRIBER_BSS_PASSWORD'),
        'operator_id' => env('SUBSCRIBER_BSS_OPERATOR_ID'),
        'channel_id' => 59,
        'technical_channel_id' => 35,
        'tenant_id' => 101,
    ],

    'check_resource' => [
        'endpoint' => env('CHECK_RESOURCE_ENDPOINT'),
        'access_user' => env('CHECK_RESOURCE_ACCESS_USER'),
        'access_pwd' => env('CHECK_RESOURCE_ACCESS_PASSWORD'),
        'channel_id' => env('CHECK_RESOURCE_CHANNEL_ID'),
        'technical_channel_id' => env('CHECK_RESOURCE_TECHNICAL_CHANNEL_ID'),
        'staff_name' => env('CHECK_RESOURCE_STAFF_NAME', 'superadmin'),
        'staff_code' => env('CHECK_RESOURCE_STAFF_CODE', '1'),
    ],

    'select_offer' => [
        'endpoint' => env('SELECT_OFFER_SOAP_ENDPOINT'),
        'user' => env('SELECT_OFFER_SOAP_USER'),
        'password' => env('SELECT_OFFER_SOAP_PASSWORD'),
        'channel_id' => env('SELECT_OFFER_SOAP_CHANNEL_ID'),
        'tech_channel_id' => env('SELECT_OFFER_SOAP_TECH_CHANNEL_ID'),
        'tenant_id' => env('SELECT_OFFER_SOAP_TENANT_ID'),
    ],

    'change_offer' => [
        'endpoint' => env('CHANGE_OFFER_SOAP_ENDPOINT'),
        'user' => env('CHANGE_OFFER_SOAP_USER'),
        'password' => env('CHANGE_OFFER_SOAP_PASSWORD'),
        'channel_id' => env('CHANGE_OFFER_SOAP_CHANNEL_ID'),
        'tech_channel_id' => env('CHANGE_OFFER_SOAP_TECH_CHANNEL_ID'),
        'tenant_id' => env('CHANGE_OFFER_SOAP_TENANT_ID'),
    ],

    'query_available_number' => [
        'endpoint' => env('QUERY_AVAILABLE_NUMBER_URL'),
        'user' => env('QUERY_AVAILABLE_NUMBER_USER'),
        'password' => env('QUERY_AVAILABLE_NUMBER_PASSWORD'),
        'channel_id' => env('QUERY_AVAILABLE_NUMBER_CHANNEL_ID', 59),
        'tech_channel_id' => env('QUERY_AVAILABLE_NUMBER_TECH_CHANNEL_ID', 59),
    ],

    'get_account_list' => [
        'endpoint' => env('GET_ACCOUNT_LIST_URL'),
        'user' => env('GET_ACCOUNT_LIST_USER'),
        'password' => env('GET_ACCOUNT_LIST_PASSWORD'),
        'channel_id' => env('GET_ACCOUNT_LIST_CHANNEL_ID', 59),
        'tech_channel_id' => env('GET_ACCOUNT_LIST_TECH_CHANNEL_ID', 51),
        'tenant_id' => env('GET_ACCOUNT_LIST_TENANT_ID', 101),
    ],

    'primary_offers' => [
        'endpoint' => env('PRIMARY_OFFERS_URL'),
        'access_user' => env('PRIMARY_OFFERS_USER'),
        'access_pwd' => env('PRIMARY_OFFERS_PASS'),
        'channel_id' => env('PRIMARY_OFFERS_CHANNEL_ID'),
        'technical_channel_id' => env('PRIMARY_OFFERS_TECH_CHANNEL_ID'),
    ],

    'otp' => [
        'endpoint' => env('NID_ENDPOINT'),
        'access_user' => env('NID_ACCESS_USER', 'ecaf'),
        'access_password' => env('NID_ACCESS_PASSWORD'),
        'operator_id' => env('NID_OPERATOR_ID', '512'),
        'tenant_id' => env('NID_TENANT_ID', '101'),
        'channel' => env('NID_CHANNEL', '35'),
        'language' => env('NID_LANGUAGE', '2002'),
        'id' => env('ID', 'ethiotel'),
        'client_secret' => env('CLIENT_SECRET'),
        'env' => env('ENV', 'prod'),
        'domain_uri' => env('DOMAINURI', 'fayda.et'),
        'individual_id_type' => env('INDIVIDUAL_ID_TYPE', 'FCN'),
        'otp_channel' => env('OPTCHANNEL', 'phone'),
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
        'individual_id_type' => env('INDIVIDUAL_ID_TYPE', 'FCN'),
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

    'one_off_fee' => [
        'endpoint' => env('ONE_OFF_FEE_ENDPOINT'),
        'tenant_id' => env('ONE_OFF_FEE_TENANT_ID', '101'),
        'channel_id' => env('ONE_OFF_FEE_CHANNEL_ID', '61'),
        'technical_channel_id' => env('ONE_OFF_FEE_TECHNICAL_CHANNEL_ID', 'KIOSK'),
        'access_user' => env('ONE_OFF_FEE_ACCESS_USER', 'kiosk'),
        'access_pwd' => env('ONE_OFF_FEE_ACCESS_PWD', 'REDACTED_PASSWORD'),
        'language' => env('ONE_OFF_FEE_LANGUAGE', '2002'),
        'version' => env('ONE_OFF_FEE_VERSION', '1'),
    ],

    'number_service_reserve' => [
        'endpoint' => env('NUMBER_SERVICE_RESERVE_ENDPOINT'),
        'version' => env('NUMBER_SERVICE_RESERVE_VERSION', '1'),
        'language' => env('NUMBER_SERVICE_RESERVE_LANGUAGE', '2022'),
        'channel_id' => env('NUMBER_SERVICE_RESERVE_CHANNEL_ID', '61'),
        'technical_channel_id' => env('NUMBER_SERVICE_RESERVE_TECHNICAL_CHANNEL_ID', '55'),
        'tenant_id' => env('NUMBER_SERVICE_RESERVE_TENANT_ID', '101'),
        'access_user' => env('NUMBER_SERVICE_RESERVE_ACCESS_USER', 'kiosk'),
        'access_pwd' => env('NUMBER_SERVICE_RESERVE_ACCESS_PWD', 'secret=='),
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

    'fayda' => [
        'client_id' => env('FAYDA_CLIENT_ID'),
        'redirect_uri' => env('FAYDA_REDIRECT_URI'),
        'auth_url' => env('FAYDA_AUTH_URL'),
        'token_url' => env('FAYDA_TOKEN_URL'),
        'userinfo_url' => env('FAYDA_USERINFO_URL'),
        'private_jwk' => env('FAYDA_PRIVATE_JWK'),
        'alg' => env('FAYDA_ALG', 'RS256'),
        'assertion_type' => env('FAYDA_ASSERTION_TYPE'),
    ],

    'esignet' => [
        'client_id' => env('FAYDA_CLIENT_ID'),
        'redirect_uri' => env('FAYDA_REDIRECT_URI'),
        'authorization_endpoint' => env('FAYDA_AUTH_URL'),
        'token_endpoint' => env('FAYDA_TOKEN_URL'),
        'userinfo_endpoint' => env('FAYDA_USERINFO_URL'),
        'client_assertion_type' => env('FAYDA_ASSERTION_TYPE'),
        'private_key' => env('FAYDA_PRIVATE_KEY'),
        'expiration_time' => env('EXPIRATION_TIME', 15),
        'algorithm' => env('ALGORITHM', 'RS256'),
    ],

    'google' => [
        'google_api_key' => env('GOOGLE_API_KEY'),
        'maps_server_key' => env('GOOGLE_MAPS_SERVER_KEY'),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    ],

    'tt' => [
        'endpoint' => env('ETHIOSPM_ENDPOINT'),
        'timeout' => 30,
        'username' => env('ETHIOSPM_USERNAME'),
        'password' => env('ETHIOSPM_PASSWORD'),
    ],


];
