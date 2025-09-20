<?php

namespace App\Providers;

use App\Services\CreateOrderService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
                config('services.telebirr.merchant_code')
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Inertia::share([
            'auth' => function () {
                return [
                    'user' => Auth::guard('otp')->user() ?: null
                ];
            }
        ]);
        RateLimiter::for('service_client', function (Request $request) {
            return Limit::perSecond(5, 3)->by($request->ip()) // 3 requests for every 5 seconds
                ->response(function () {
                    return response()->json([
                        'message' => 'Rate limit exceeded. Please wait a second 5.',
                    ], 429);
                });
        });
    }
}
