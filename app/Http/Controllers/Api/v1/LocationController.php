<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\Wereda;
use App\Models\Zone;

class LocationController extends Controller
{
    public function regions()
    {
        return Region::query()->where('status', true)->orderBy('name', 'asc')->get(['id', 'name']);
    }

    public function zones($regionId)
    {
        return Zone::query()->where('region_id', $regionId)->where('status', true)->orderBy('name', 'asc')->get(['id', 'name']);
    }

    public function weredas($zoneId)
    {
        return Wereda::where('zone_id', $zoneId)->where('status', true)->orderBy('name', 'asc')->get(['id', 'name']);
    }
}
