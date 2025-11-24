<?php


namespace App\Http\Controllers;

use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class MapController extends Controller
{

    public function create()
    {
        \Log::info(config('services.google.google_api_key'));

        return Inertia::render('ServiceRequest/Create', [
            'googleMapsApiKey' => config('services.google.google_api_key'),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        // ServiceRequest::create([
        //     'user_id' => auth()->id(),
        //     'latitude' => $request->latitude,
        //     'longitude' => $request->longitude,
        // ]);

        return back()->with('success', 'Service request submitted successfully.');
    }
}
