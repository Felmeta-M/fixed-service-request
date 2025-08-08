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

    'national_id_secret_key' => env('NATIONAL_ID_SECRET_KEY', 'REDACTED_SECRET_KEY'),

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

    'query_customer' => [
        'url' => env('QUERY_CUSTOMER_URL', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'user' => env('QUERY_CUSTOMER_USER'),
        'password' => env('QUERY_CUSTOMER_PASS'),
    ],

    'query_customer_by_service_number' => [
        'customer_query_endpoint'      => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_CUSTOMER_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'language'               => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_LANGUAGE'),
        'channel_id'             => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_CHANNEL_ID'),
        'technical_channel_id'   => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_TECH_CHANNEL_ID'),
        'access_user'            => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_ACCESS_USER'),
        'access_pwd'             => env('QUERY_CUSTOMER_BY_SERVICE_NUMBER_ACCESS_PWD'),
    ],

    'survey' => [
        'endpoint' => env('SURVEY_BSS_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'access_user' => env('SURVEY_BSS_ACCESS_USER'),
        'access_password' => env('SURVEY_BSS_ACCESS_PASSWORD'),
        'channel_id' => env('SURVEY_BSS_CHANNEL_ID'),
        'technical_channel_id' => env('SURVEY_TECHNICAL_CHANNEL_ID'),
    ],

    'subscriber' => [
        'endpoint' => env('SUBSCRIBER_BSS_ENDPOINT', "REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF"),
        'access_user' => env('SUBSCRIBER_BSS_USERNAME'),
        'access_pwd' => env('SUBSCRIBER_BSS_PASSWORD'),
        'operator_id' => env('SUBSCRIBER_BSS_OPERATOR_ID'),
        'channel_id' => 59,
        'technical_channel_id' => 35,
        'tenant_id' => 101,
    ],

    'check_resource' => [
        'endpoint' => env('CHECK_RESOURCE_BSS_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/ECAF/BSSForIECAF'),
        'access_user' => env('CHECK_RESOURCE_BSS_ACCESS_USER'),
        'access_password' => env('CHECK_RESOURCE_BSS_ACCESS_PASSWORD'),
        'channel_id' => env('CHECK_RESOURCE_BSS_CHANNEL_ID'),
        'technical_channel_id' => env('CHECK_RESOURCE_TECHNICAL_CHANNEL_ID'),
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
        'url' => env('QUERY_AVAILABLE_NUMBER_URL'),
        'user' => env('QUERY_AVAILABLE_NUMBER_USER'),
        'password' => env('QUERY_AVAILABLE_NUMBER_PASSWORD'),
        'channel_id' => env('QUERY_AVAILABLE_NUMBER_CHANNEL_ID', 59),
        'tech_channel_id' => env('QUERY_AVAILABLE_NUMBER_TECH_CHANNEL_ID', 59),
    ],

    'get_account_list' => [
        'url' => env('GET_ACCOUNT_LIST_URL'),
        'user' => env('GET_ACCOUNT_LIST_USER'),
        'password' => env('GET_ACCOUNT_LIST_PASSWORD'),
        'channel_id' => env('GET_ACCOUNT_LIST_CHANNEL_ID', 59),
        'tech_channel_id' => env('GET_ACCOUNT_LIST_TECH_CHANNEL_ID', 51),
        'tenant_id' => env('GET_ACCOUNT_LIST_TENANT_ID', 101),
    ],

    'primary_offers' => [
        'url' => env('PRIMARY_OFFERS_URL'),
        'access_user' => env('PRIMARY_OFFERS_USER'),
        'access_pwd' => env('PRIMARY_OFFERS_PASS'),
        'channel_id' => env('PRIMARY_OFFERS_CHANNEL_ID'),
    ],

    'nid' => [
        'endpoint' => env('NID_ENDPOINT', 'REDACTED_INTERNAL_ENDPOINT/NIDService/CRM_NID'),
        'access_user' => env('NID_ACCESS_USER', 'ecaf'),
        'access_password' => env('NID_ACCESS_PASSWORD', 'REDACTED_PASSWORD'),
        'operator_id' => env('NID_OPERATOR_ID', '512'),
        'tenant_id' => env('NID_TENANT_ID', '101'),
        'channel' => env('NID_CHANNEL', '35'),
        'language' => env('NID_LANGUAGE', '2002'),
        'id' => env('ID', 'ethiotel'),
        'clientSecret' => env('CLIENTSECRET', 'REDACTED_CLIENT_SECRET'),
        'env' => env('ENV', 'prod'),
        'domainUri' => env('DOMAINURI', 'fayda.et'),
        'individualIdType' => env('INDIVIDUALIDTYPE', 'FCN'),
        'otpChannel' => env('OPTCHANNEL', 'phone'),
    ],

];
