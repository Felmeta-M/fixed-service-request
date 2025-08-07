<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\ServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceClientController extends Controller
{
    public function issueToken(Request $request)
    {
        $code = $request->input('code');

        $client = ServiceClient::firstOrCreate([
            'code' => preg_replace('/[^0-9]/', '', substr($code, -9))
        ]);

        if (!$client) {
            return response()->json(['message' => 'Invalid code'], 401);
        }

        $plainToken = Str::random(40);
        $client->api_token = $plainToken;
        $client->save();
        // $client->tokens()->create([
        //     'name' => 'fixed services request',
        //     'token' => hash('sha256', $plainToken),
        //     'abilities' => ['read', 'write'],
        // ]);

        return response()->json([
            'access_token' => $plainToken,
            'type' => 'Bearer',
            // 'scopes' => ['read', 'write'],
        ]);
    }
}
