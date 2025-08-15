<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class SupportRequestController extends Controller
{
    public function index(Request $request)
    {
        // Example: fetch support requests for the logged-in client
        $requests = [
            ['id' => 1, 'title' => 'Issue with service', 'status' => 'Pending'],
            ['id' => 2, 'title' => 'Billing question', 'status' => 'Resolved']
        ];

        return Inertia::render('SupportRequest', [
            'user' => $request->user(),
            'requests' => $requests
        ]);
    }
}