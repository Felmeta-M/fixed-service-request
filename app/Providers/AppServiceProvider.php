<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use RateLimiter;

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
        RateLimiter::for('service-client', function (Request $request) {
            Limit::perSecond(15, 60)->by(optional($request->user())->code ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Rate limit exceeded. Please wait a second.',
                    ], 429);
                });;
        });
    }
}
