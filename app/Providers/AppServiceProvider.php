<?php

namespace App\Providers;

use App\Services\CreateOrderService;
use App\Services\Logging\AppLogger;
use App\Services\Logging\HttpClientLogger;
use App\Services\Logging\QueryLogger;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CreateOrderService::class, function ($app) {
            return new CreateOrderService(
                config('services.telebirr.base_url'),
                config('services.telebirr.web_base_url'),
                config('services.telebirr.fabric_app_id'),
                config('services.telebirr.app_secret'),
                config('services.telebirr.merchant_app_id'),
                config('services.telebirr.merchant_code'),
                $app->make(PaymentService::class),
            );
        });

        // Register AppLogger as singleton
        $this->app->singleton(AppLogger::class, function ($app) {
            return new AppLogger();
        });
    }

    /**
     * Bootstrap logging services.
     */
    protected function bootLogging(): void
    {
        // Register HTTP client logging macros
        HttpClientLogger::register();

        // Enable query logging for performance monitoring
        if (config('app.debug') || config('logging.query_log_all', false)) {
            QueryLogger::enable();
        }

        // Always enable slow query logging in production
        if (app()->isProduction()) {
            QueryLogger::enable();
        }

        // Log query summary at end of request
        $this->app->terminating(function () {
            QueryLogger::logSummary();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Initialize professional logging
        $this->bootLogging();

        Inertia::share([
            'auth' => function () {
                return [
                    'user' => Auth::guard('otp')->user() ?: null
                ];
            }
        ]);

        // Rate limiter for service client token endpoints
        RateLimiter::for('service_client', function (Request $request) {
            return Limit::perSecond(5, 3)->by($request->ip()) // 3 requests for every 5 seconds
                ->response(function () {
                    return response()->json([
                        'message' => 'Rate limit exceeded. Please wait a second 5.',
                    ], 429);
                });
        });

        // Rate limiter for public read-only endpoints (survey-types, bandwidth-options, occupations, locations)
        RateLimiter::for('api_public', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate limiter for general authenticated endpoints
        RateLimiter::for('api_authenticated', function (Request $request) {
            $user = $request->user();
            $key = $user ? $user->id : $request->ip();

            return Limit::perMinute(120)->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate limiter for critical operations (payments, orders, subscriptions)
        RateLimiter::for('api_critical', function (Request $request) {
            $user = $request->user();
            $key = $user ? $user->id : $request->ip();

            return Limit::perMinute(30)->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Rate limit exceeded for critical operations. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate limiter for heavy operations (survey creation, customer creation)
        RateLimiter::for('api_heavy', function (Request $request) {
            $user = $request->user();
            $key = $user ? $user->id : $request->ip();

            return Limit::perMinute(40)->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Rate limit exceeded for this operation. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate limiter for trouble ticket operations
        RateLimiter::for('api_trouble_tickets', function (Request $request) {
            $user = $request->user();
            $key = $user ? $user->id : $request->ip();

            return Limit::perMinute(60)->by($key)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Too many trouble ticket requests. Please try again later.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        RateLimiter::for('send-sms', function (Request $request) {
            $phone = preg_replace('/\D/', '', $request->input('phone'));

            return [
                // Per IP
                Limit::perMinute(3)->by($request->ip()),

                // Per phone number
                Limit::perHour(5)->by('sms:phone:' . $phone),
            ];
        });

        if (app()->isProduction()) {
            URL::forceScheme('https');
        }
    }
}
