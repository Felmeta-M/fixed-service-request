<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SMS Notification Templates
    |--------------------------------------------------------------------------
    |
    | Standardized SMS notification templates for survey and subscription
    | services. Use placeholders for dynamic content:
    |
    | {customer_name}    - Customer's name
    | {service_type}     - Voice, Data, or Combo
    | {order_number}     - Request number (survey/subscription order ID)
    | {service_number}   - Activated service number
    | {username}         - Internet account username
    | {password}         - Internet account password
    |
    */

    'templates' => [

        /*
        |----------------------------------------------------------------------
        | Survey Notifications
        |----------------------------------------------------------------------
        |
        | Sent when a technical survey order is created (manual process).
        | Triggered during sync with third-party API when status changes.
        |
        */

        'survey_created' => <<<'SMS'
Dear {customer_name},

As per your request, a technical survey for your {service_type} service has been completed. Your request number is {order_number}.

For information or support, contact us via:
- Call: 994
- SMS: 8994
- WhatsApp: +251 99 400 0000
- Email: 994@ethionet.et
- Facebook: facebook.com/ethiotelecom
- Twitter: twitter.com/ethiotelecom

We are always delighted to serve you.
Ethio telecom
SMS,

        /*
        |----------------------------------------------------------------------
        | Survey Failed Notifications
        |----------------------------------------------------------------------
        |
        | Sent when a manual survey fails during sync with third-party API.
        |
        */

        'survey_failed' => <<<'SMS'
Dear {customer_name},

We regret to inform you that the technical survey for your {service_type} service request could not be completed. Your request number is {order_number}.

{failure_reason}

Please contact our support team for assistance:
- Call: 994
- SMS: 8994
- WhatsApp: +251 99 400 0000
- Email: 994@ethionet.et

We apologize for any inconvenience.
Ethio telecom
SMS,

        /*
        |----------------------------------------------------------------------
        | Subscription Activation Notifications
        |----------------------------------------------------------------------
        |
        | Sent when a subscription is successfully activated (auto process).
        |
        */

        'subscription_activated' => <<<'SMS'
Welcome to Ethio telecom!

Your new {service_type} service has been activated. Your service number is {service_number}.

For information or support, contact us via:
- Call: 994
- SMS: 8994
- Web: ethiotelecom.et
- Email: 994@ethionet.et
- WhatsApp: +251 99 400 0000
- Telegram: t.me/ethio_telecom

We are always delighted to serve you.
Ethio telecom
SMS,

        /*
        |----------------------------------------------------------------------
        | Internet Credentials Notification
        |----------------------------------------------------------------------
        |
        | Sent after Data or Combo subscription activation with internet
        | account credentials for customer's device configuration.
        |
        */

        'internet_credentials' => <<<'SMS'
Dear Customer,

Your internet account credentials for service number {service_number}:
- Username: {username}
- Password: {password}

Self-care portal: fixedbroadband.ethiotelecom.et/Selfcare

For information or support, contact us via:
- Call: 994
- SMS: 8994
- Web: ethiotelecom.et
- Email: 994@ethionet.et
- WhatsApp: +251 99 400 0000
- Telegram: t.me/ethio_telecom

We are always delighted to serve you.
Ethio telecom
SMS,

    ],

    /*
    |--------------------------------------------------------------------------
    | Service Type Labels
    |--------------------------------------------------------------------------
    |
    | Human-readable labels for service types used in notifications.
    |
    */

    'service_types' => [
        'voice' => 'Voice',
        'data' => 'Data',
        'combo' => 'Voice and Data (Combo)',
    ],

    /*
    |--------------------------------------------------------------------------
    | Contact Information
    |--------------------------------------------------------------------------
    |
    | Centralized contact details for consistency across all notifications.
    |
    */

    'contacts' => [
        'call_center' => '994',
        'sms' => '8994',
        'whatsapp' => '+251 99 400 0000',
        'email' => '994@ethionet.et',
        'website' => 'ethiotelecom.et',
        'facebook' => 'facebook.com/ethiotelecom',
        'twitter' => 'twitter.com/ethiotelecom',
        'telegram' => 't.me/ethio_telecom',
        'selfcare' => 'fixedbroadband.ethiotelecom.et/Selfcare',
    ],

];
