<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ServiceClient;
use App\Traits\InteractsWithSMSGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientAuthController extends Controller
{
    use InteractsWithSMSGateway;

    protected function NormalizePhone($phone)
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        return substr($phone, -9);
    }

    public function sendOneTimePassword(Request $request)
    {
        $phone = $this->NormalizePhone($request->phone);
        return $this->sendOTP($phone);
    }

    public function verifyOnetimePassword(Request $request)
    {
        return $this->verifyOTP($request->otp);
    }

    public function login(Request $request)
    {
        $phone = $this->NormalizePhone($request->phone);
        $client = ServiceClient::firstOrCreate([
            'phone' => $this->NormalizePhone($phone)
        ]);

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
