<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ServiceClient;
use App\Traits\InteractsWithSMSGateway;
use Exception;
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
        return  $this->sendOTP($phone);
    }

    public function verifyOneTimePassword(Request $request)
    {
        $response =  $this->verifyOTP($request->otp);
        if ($response['success'] == true) {
            $this->login($request);
        }

        return $response;
    }

    public function login(Request $request)
    {
        $phone = $this->NormalizePhone($request->phone);
        $client = ServiceClient::firstOrCreate([
            'phone' => $this->NormalizePhone($phone)
        ]);

        Auth::guard('client')->login($client);

        $user = Auth::guard('client')->user();

        return redirect()->intended(route('client.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('client.login');
    }
}
