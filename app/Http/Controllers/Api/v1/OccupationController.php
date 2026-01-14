<?php

namespace App\Http\Controllers\Api\v1;

use App\Models\Occupation;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class OccupationController extends Controller
{
    private const CACHE_KEY = 'occupations:active';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Display active occupations - cached Query Builder
     */
    public function index()
    {
        $occupations = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('occupations')
                ->where('status', true)
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $occupations,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $occupation = Occupation::create($data);

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'data' => $occupation
        ], 201);
    }

    /**
     * Show single occupation - Query Builder
     */
    public function show($id)
    {
        $occupation = DB::table('occupations')->find($id);

        if (!$occupation) {
            return response()->json([
                'success' => false,
                'message' => 'Occupation not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $occupation
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $updated = DB::table('occupations')
            ->where('id', $id)
            ->update([
                'name' => $data['name'],
                'updated_at' => now(),
            ]);

        if (!$updated) {
            return response()->json([
                'success' => false,
                'message' => 'Occupation not found'
            ], 404);
        }

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        $occupation = DB::table('occupations')->find($id);

        return response()->json([
            'success' => true,
            'data' => $occupation
        ]);
    }

    public function destroy($id)
    {
        $deleted = DB::table('occupations')
            ->where('id', $id)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Occupation not found'
            ], 404);
        }

        // Clear cache on modification
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'success' => true,
            'message' => 'Occupation deleted successfully'
        ]);
    }
}
