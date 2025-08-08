<?php

namespace App\Providers;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
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
