<?php

use App\Http\Middleware\EnsureOtpAuthenticated;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use App\Jobs\CheckSurveyOrderStatus;
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
        $middleware
            ->validateCsrfTokens(except: [
                'telebirr/notify',
                'locale',
            ])
            ->web(append: [
                SetLocale::class,
                HandleAppearance::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ])
            ->alias([
                'otp.auth' => EnsureOtpAuthenticated::class,
            ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        $schedule->job(new CheckSurveyOrderStatus())->everyTwoMinutes();
    })
    ->withExceptions(function (Exceptions $exceptions) {})
    ->create();
