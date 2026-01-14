<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\BandwidthOption;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BandwidthOptionController extends Controller
{
    private const CACHE_KEY = 'bandwidth_options:all';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display a listing - cached Query Builder
     */
    public function index()
    {
        $options = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('bandwidth_options')
                ->select(['id', 'residential', 'enterprise', 'created_at'])
                ->get()
                ->map(function ($option) {
                    // Decode JSON fields
                    $option->residential = json_decode($option->residential, true);
                    $option->enterprise = json_decode($option->enterprise, true);
                    return $option;
                });
        });

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'residential' => 'required|array',
            'enterprise' => 'required|array'
        ]);

        $option = BandwidthOption::create([
            'residential' => json_encode($data['residential']),
            'enterprise' => json_encode($data['enterprise']),
        ]);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $option
        ], 201);
    }

    /**
     * Show single option - use cache if available
     */
    public function show($id)
    {
        // Try to get from cached list first
        $options = Cache::get(self::CACHE_KEY);

        if ($options) {
            $option = collect($options)->firstWhere('id', (int) $id);
            if ($option) {
                return response()->json([
                    'success' => true,
                    'data' => $option
                ]);
            }
        }

        // Fall back to direct query
        $option = DB::table('bandwidth_options')->find($id);

        if (!$option) {
            return response()->json([
                'success' => false,
                'message' => 'Bandwidth option not found'
            ], 404);
        }

        $option->residential = json_decode($option->residential, true);
        $option->enterprise = json_decode($option->enterprise, true);

        return response()->json([
            'success' => true,
            'data' => $option
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'residential' => 'sometimes|array',
            'enterprise' => 'sometimes|array'
        ]);

        $updateData = ['updated_at' => now()];

        if (isset($data['residential'])) {
            $updateData['residential'] = json_encode($data['residential']);
        }

        if (isset($data['enterprise'])) {
            $updateData['enterprise'] = json_encode($data['enterprise']);
        }

        $updated = DB::table('bandwidth_options')
            ->where('id', $id)
            ->update($updateData);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Bandwidth option not found'
            ], 404);
        }

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        $option = DB::table('bandwidth_options')->find($id);
        $option->residential = json_decode($option->residential, true);
        $option->enterprise = json_decode($option->enterprise, true);

        return response()->json([
            'success' => true,
            'data' => $option
        ]);
    }

    public function destroy($id)
    {
        $deleted = DB::table('bandwidth_options')
            ->where('id', $id)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Bandwidth option not found'
            ], 404);
        }

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
