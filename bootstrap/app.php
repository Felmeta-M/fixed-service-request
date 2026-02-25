<?php

use App\Exceptions\Handler;
use App\Http\Middleware\EnsureOtpAuthenticated;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogHttpRequests;
use App\Http\Middleware\SanitizeInput;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use App\Jobs\CheckSurveyOrderStatus;
use App\Jobs\BatchRefreshSurveyOrdersJob;
use App\Console\Commands\SyncThirdPartyTickets;
use App\Enums\FFDServiceProvisionStatus;
use Illuminate\Support\Facades\DB;
use App\Services\Logging\AppLogger;
use App\Services\Security\SecureOtpService;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Trust reverse proxy (Nginx/Docker) so signed URLs, HTTPS detection, etc. work
        $middleware->trustProxies(at: '*');

        // Security middleware (runs first)
        $middleware->prepend(SecurityHeaders::class);

        // Input sanitization (runs early)
        $middleware->prepend(SanitizeInput::class);

        // HTTP logging middleware (runs after security)
        $middleware->append(LogHttpRequests::class);

        $middleware
            ->validateCsrfTokens(except: [
                'telebirr/notify', // Payment webhook
                'locale',
                'api/*', // API routes use token auth
            ])
            ->web(append: [
                SetLocale::class,
                HandleAppearance::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ])
            ->alias([
                'otp.auth' => EnsureOtpAuthenticated::class,
                // In production, enforce signed URLs; in dev/local, skip validation
                'signed' => \App\Http\Middleware\ValidateSignedUrl::class,
            ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->job(new CheckSurveyOrderStatus())->everyTwoMinutes()->name('check-survey-order-status');

        // Periodically dispatch batch refresh jobs for WAITING survey orders
        $schedule->call(function () {
            $ids = DB::table('survey_orders')
                ->whereNull('deleted_at')
                ->where('status', FFDServiceProvisionStatus::Waiting->value)
                ->whereNotNull('customer_survey_order_id')
                ->limit(500)
                ->pluck('id')
                ->all();

            if (! empty($ids)) {
                BatchRefreshSurveyOrdersJob::dispatch($ids);
            }
        })->everyFiveMinutes()->name('batch-refresh-survey-orders');

        // Periodically sync trouble tickets from third-party system
        $schedule->command('tickets:sync')->everyFiveMinutes()->name('sync-trouble-tickets');

        // Professional log management - clean logs older than 30 days weekly
        $schedule->command('logs:manage clean --days=30')
            ->weekly()
            ->sundays()
            ->at('02:00')
            ->description('Clean old log files');

        // Archive logs older than 14 days monthly
        $schedule->command('logs:manage archive --days=14')
            ->monthly()
            ->at('03:00')
            ->description('Archive old log files');

        // Security: Clean up expired OTPs hourly
        $schedule->call(function () {
            app(SecureOtpService::class)->cleanupExpired();
        })->hourly()->description('Clean up expired OTPs');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Log all exceptions using our professional logger
        $exceptions->reportable(function (\Throwable $e) {
            AppLogger::default()->exception($e);
        });
    })
    ->create();
