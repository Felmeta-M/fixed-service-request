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

    'soap' => [
        'url' => env('SOAP_URL'),
        'version' => env('SOAP_VERSION', 1),
        'language' => env('SOAP_LANGUAGE', '2002'),
        'channel_id' => env('SOAP_CHANNEL_ID', '64'),
        'technical_channel_id' => env('SOAP_TECHNICAL_CHANNEL_ID', '53'),
        'tenant_id' => env('SOAP_TENANT_ID', '101'),
        'access_user' => env('SOAP_ACCESS_USER'),
        'access_password' => env('SOAP_ACCESS_PASSWORD'),
    ],

    'customer' =>  [
        'access_user' => env('CUSTOMER_ACCESS_USER', 'kiosk'),
        'access_password' => env('CUSTOMER_ACCESS_PWD'),
        'channel_id' => env('CUSTOMER_CHANNEL_ID', '61'),
        'technical_channel_id' => env('CUSTOMER_TECH_CHANNEL_ID', '51'),
        'tenant_id' => env('CUSTOMER_TENANT_ID', '101'),
        'create_endpoint' => env('CUSTOMER_CREATE_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'query_endpoint' => env('CUSTOMER_QUERY_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/SELFCARE/OrderQueryETCtz'),
    ],

    'survey' => [
        'endpoint' => env('SURVEY_BSS_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'access_user' => env('SURVEY_BSS_ACCESS_USER'),
        'access_password' => env('SURVEY_BSS_ACCESS_PASSWORD'),
        'channel_id' => env('SURVEY_BSS_CHANNEL_ID'),
        'technical_channel_id' => env('SURVEY_TECHNICAL_CHANNEL_ID'),
    ],

    'subscriber' => [
        'endpoint' => env('SUBSCRIBER_BSS_ENDPOINT'),
        'access_user' => env('SUBSCRIBER_BSS_USERNAME'),
        'access_pwd' => env('SUBSCRIBER_BSS_PASSWORD'),
        'operator_id' => env('SUBSCRIBER_BSS_OPERATOR_ID'),
        'channel_id' => 59,
        'technical_channel_id' => 35,
        'tenant_id' => 101,
    ]

];
