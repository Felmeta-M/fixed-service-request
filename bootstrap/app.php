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
use Illuminate\Support\Facades\Cache;
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
        $chunkSize = 500;
        $maxIdsPerRun = 10_000; // Cap work per run: at most this many IDs → at most (maxIdsPerRun / chunkSize) jobs per run

        // Check survey order status using cursor-based pagination (no full-table scan).
        // We cache the last processed `survey_orders.id` in `$cursorKey`, query the next page via
        // `WHERE id > $lastId ORDER BY id LIMIT $maxIdsPerRun`, dispatch jobs in `$chunkSize` batches,
        // then advance the cursor to `max($ids)` for the next scheduled run.
        $schedule->call(function () use ($chunkSize, $maxIdsPerRun) {
            $cursorKey = 'schedule.check_survey_order_status.last_id';
            $lastId = (int) Cache::get($cursorKey, 0);

            $ids = DB::table('survey_orders')
                ->whereNull('deleted_at')
                ->where('status', FFDServiceProvisionStatus::Waiting->value)
                ->whereNull('customer_subscription_order_id')
                ->where('id', '>', $lastId)
                ->orderBy('id')
                ->limit($maxIdsPerRun)
                ->pluck('id')
                ->values()
                ->all();

            if (empty($ids)) {
                Cache::put($cursorKey, 0);

                return;
            }

            foreach (array_chunk($ids, $chunkSize) as $chunk) {
                CheckSurveyOrderStatus::dispatch($chunk);
            }

            Cache::put($cursorKey, (int) max($ids));
        })->hourly()->name('check-survey-order-status');

        // Batch refresh WAITING survey orders: cursor-based, same scaling approach
        $schedule->call(function () use ($chunkSize, $maxIdsPerRun) {
            $cursorKey = 'schedule.batch_refresh_survey_orders.last_id';
            $lastId = (int) Cache::get($cursorKey, 0);

            $ids = DB::table('survey_orders')
                ->whereNull('deleted_at')
                ->where('status', FFDServiceProvisionStatus::Waiting->value)
                ->whereNotNull('customer_subscription_order_id')
                ->where('id', '>', $lastId)
                ->orderBy('id')
                ->limit($maxIdsPerRun)
                ->pluck('id')
                ->values()
                ->all();

            if (empty($ids)) {
                Cache::put($cursorKey, 0);

                return;
            }

            foreach (array_chunk($ids, $chunkSize) as $chunk) {
                BatchRefreshSurveyOrdersJob::dispatch($chunk);
            }

            Cache::put($cursorKey, (int) max($ids));
        })->everyThirtyMinutes()->name('batch-refresh-survey-orders');

        // Periodically sync trouble tickets from third-party system
        $schedule->command('tickets:sync')->hourly()->name('sync-trouble-tickets');

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
