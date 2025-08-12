<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientAuthController extends Controller
{
    public function login(Request $request)
    {
        // Assuming we have already verified OTP before this step
        $client = \App\Models\ServiceClient::firstOrCreate($request->phone);

        Auth::guard('client')->login($client);

        return redirect()->route('client.dashboard');
    }

    public function logout(Request $request)
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('client.login');
    }
}
