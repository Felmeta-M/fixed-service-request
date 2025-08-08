<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\Wereda;
use App\Models\Zone;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function regions()
    {
        return Region::whereNull('deleted_at')->orderBy('name', 'asc')->get(['id', 'name']);
    }

    public function zones($regionId)
    {
        return Zone::where('region_id', $regionId)->orderBy('name', 'asc')->get(['id', 'name']);
    }

    public function weredas($zoneId)
    {
        return Wereda::where('zone_id', $zoneId)->orderBy('name', 'asc')->get(['id', 'name']);
    }
}
