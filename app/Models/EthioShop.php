<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EthioShop extends Model
{
    protected $table = 'ethio_shops';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'zone',
        'area_id',
        'center_name',
        'building_name',
        'specific_location',
        'latitude',
        'longitude',
        'status',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'area_id' => 'integer',
        'latitude' => 'float',
        'longitude' => 'float',
        'status' => 'boolean',
    ];

    /**
     * Scope for active shops only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
