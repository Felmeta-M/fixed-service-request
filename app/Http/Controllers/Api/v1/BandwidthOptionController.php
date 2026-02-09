<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BandwidthOptionController extends Controller
{
    private const CACHE_KEY_RESIDENTIAL = 'bandwidth_options:residential';
    private const CACHE_KEY_ENTERPRISE = 'bandwidth_options:enterprise';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get bandwidth options (backward compatibility - returns only residential)
     */
    public function index()
    {
        $options = Cache::remember(self::CACHE_KEY_RESIDENTIAL, self::CACHE_TTL, function () {
            $data = DB::table('bandwidth_options')
                ->select(['id', 'residential_options', 'created_at'])
                ->first();

            if (!$data) {
                return null;
            }

            return [
                [
                    'id' => $data->id,
                    'residential_options' => json_decode($data->residential_options, true),
                    'enterprise_options' => [], // Empty array for backward compatibility
                    'created_at' => $data->created_at,
                ]
            ];
        });

        if (!$options) {
            return response()->json([
                'success' => false,
                'message' => 'Bandwidth options not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }

    /**
     * Get residential bandwidth options only
     */
    public function residential()
    {
        $options = Cache::remember(self::CACHE_KEY_RESIDENTIAL, self::CACHE_TTL, function () {
            $data = DB::table('bandwidth_options')
                ->select(['id', 'residential_options', 'created_at'])
                ->first();

            if (!$data) {
                return null;
            }

            return [
                'id' => $data->id,
                'residential_options' => json_decode($data->residential_options, true),
                'created_at' => $data->created_at,
            ];
        });

        if (!$options) {
            return response()->json([
                'success' => false,
                'message' => 'Residential bandwidth options not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }

    /**
     * Get enterprise bandwidth options only
     */
    public function enterprise()
    {
        $options = Cache::remember(self::CACHE_KEY_ENTERPRISE, self::CACHE_TTL, function () {
            $data = DB::table('bandwidth_options')
                ->select(['id', 'enterprise_options', 'created_at'])
                ->first();

            if (!$data) {
                return null;
            }

            return [
                'id' => $data->id,
                'enterprise_options' => json_decode($data->enterprise_options, true),
                'created_at' => $data->created_at,
            ];
        });

        if (!$options) {
            return response()->json([
                'success' => false,
                'message' => 'Enterprise bandwidth options not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }
}
