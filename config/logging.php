<?php

use App\Services\Logging\JsonLogFormatter;
use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;
use Monolog\Processor\IntrospectionProcessor;
use Monolog\Processor\WebProcessor;
use Monolog\Processor\MemoryUsageProcessor;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    |
    | This option defines the default log channel that is utilized to write
    | messages to your logs. The value provided here should match one of
    | the channels present in the list of "channels" configured below.
    |
    */

    'default' => env('LOG_CHANNEL', 'stack'),

    /*
    |--------------------------------------------------------------------------
    | Deprecations Log Channel
    |--------------------------------------------------------------------------
    |
    | This option controls the log channel that should be used to log warnings
    | regarding deprecated PHP and library features. This allows you to get
    | your application ready for upcoming major versions of dependencies.
    |
    */

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Query Logging Configuration
    |--------------------------------------------------------------------------
    */

    'query_slow_threshold' => env('LOG_QUERY_SLOW_THRESHOLD', 1000), // milliseconds
    'query_detect_n1' => env('LOG_QUERY_DETECT_N1', true),
    'query_log_all' => env('LOG_QUERY_LOG_ALL', false), // Enable in debug mode only

    /*
    |--------------------------------------------------------------------------
    | HTTP Client Logging
    |--------------------------------------------------------------------------
    */

    'http_client_log_all' => env('LOG_HTTP_CLIENT_ALL', false),

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    |
    | Here you may configure the log channels for your application. Laravel
    | utilizes the Monolog PHP logging library, which includes a variety
    | of powerful log handlers and formatters that you're free to use.
    |
    | Available drivers: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog", "custom", "stack"
    |
    */

    'channels' => [

        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', env('LOG_STACK', 'daily')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'replace_placeholders' => true,
        ],

        /*
        |--------------------------------------------------------------------------
        | JSON Formatted Channels (for log aggregation - ELK, Datadog, etc.)
        |--------------------------------------------------------------------------
        */

        'json' => [
            'driver' => 'daily',
            'path' => storage_path('logs/json/app.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'tap' => [App\Services\Logging\JsonLogTap::class],
            'replace_placeholders' => true,
        ],

        /*
        |--------------------------------------------------------------------------
        | Application-Specific Channels
        |--------------------------------------------------------------------------
        */

        // API integrations (Telebirr, Esignet, SOAP services, etc.)
        'api' => [
            'driver' => 'daily',
            'path' => storage_path('logs/api/api.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'replace_placeholders' => true,
        ],

        'api_json' => [
            'driver' => 'daily',
            'path' => storage_path('logs/api/api-json.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'tap' => [App\Services\Logging\JsonLogTap::class],
            'replace_placeholders' => true,
        ],

        // Authentication & authorization events
        'auth' => [
            'driver' => 'daily',
            'path' => storage_path('logs/auth/auth.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 30,
            'replace_placeholders' => true,
        ],

        // Payment processing
        'payment' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payment/payment.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 90, // Keep payment logs longer for auditing
            'replace_placeholders' => true,
        ],

        'payment_json' => [
            'driver' => 'daily',
            'path' => storage_path('logs/payment/payment-json.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 90,
            'tap' => [App\Services\Logging\JsonLogTap::class],
            'replace_placeholders' => true,
        ],

        // Security events (failed logins, suspicious activity, etc.)
        'security' => [
            'driver' => 'daily',
            'path' => storage_path('logs/security/security.log'),
            'level' => 'info',
            'days' => 90,
            'replace_placeholders' => true,
        ],

        // HTTP requests/responses
        'http' => [
            'driver' => 'daily',
            'path' => storage_path('logs/http/requests.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
            'replace_placeholders' => true,
        ],

        // Survey orders and business processes
        'business' => [
            'driver' => 'daily',
            'path' => storage_path('logs/business/business.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 60,
            'replace_placeholders' => true,
        ],

        // Background jobs and queues
        'jobs' => [
            'driver' => 'daily',
            'path' => storage_path('logs/jobs/jobs.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => 14,
            'replace_placeholders' => true,
        ],

        // Performance monitoring
        'performance' => [
            'driver' => 'daily',
            'path' => storage_path('logs/performance/performance.log'),
            'level' => 'info',
            'days' => 14,
            'replace_placeholders' => true,
        ],

        // Audit trail (critical business actions)
        'audit' => [
            'driver' => 'daily',
            'path' => storage_path('logs/audit/audit.log'),
            'level' => 'info',
            'days' => 365, // Keep audit logs for 1 year
            'replace_placeholders' => true,
        ],

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'),
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
            'level' => env('LOG_LEVEL', 'critical'),
            'replace_placeholders' => true,
        ],

        'papertrail' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class),
            'handler_with' => [
                'host' => env('PAPERTRAIL_URL'),
                'port' => env('PAPERTRAIL_PORT'),
                'connectionString' => 'tls://' . env('PAPERTRAIL_URL') . ':' . env('PAPERTRAIL_PORT'),
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'with' => [
                'stream' => 'php://stderr',
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => env('LOG_LEVEL', 'debug'),
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
            'replace_placeholders' => true,
        ],

        'errorlog' => [
            'driver' => 'errorlog',
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

    ],

];
