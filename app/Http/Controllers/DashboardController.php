<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::guard('otp')->user();

        \Log::info($user);

        return Inertia::render('Dashboard', [
            'user' => $user,
            'stats' => [
                'support_requests_count' => 5, // example placeholder
                'recent_activity' => []
            ]
        ]);
    }
}