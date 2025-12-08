<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        // ADD MULTI-GUARD SUPPORT
        $guards = ['web', 'otp', 'customer'];
        $currentUser = null;
        $currentGuard = null;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $currentUser = Auth::guard($guard)->user();
                $currentGuard = $guard;
                break;
            }
        }

        return [
            ...parent::share($request),

            'name' => config('app.name'),

            'quote' => [
                'message' => trim($message),
                'author' => trim($author),
            ],

            'auth' => [
                'user' => $this->transformUser($currentUser),
            ],

            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            'sidebarOpen' => !$request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',

            'latestResource' => fn() => session('latest_resource', null)
        ];
    }

    private function transformUser($user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'customer_sub_id' => $user?->customer_sub_id,
            'customer_code' => $user?->customer_code,
            'name' => $user->name,
            'phone' => $user->phone,
        ];
    }
}
