<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelecomRegion extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'area_id',
        'area_name',
        'zone',
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
        'status' => 'boolean',
    ];

    /**
     * Scope for active regions only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope to filter by zone.
     */
    public function scopeByZone($query, string $zone)
    {
        return $query->where('zone', $zone);
    }

    /**
     * Find by area name (case-insensitive).
     */
    public static function findByName(string $name): ?self
    {
        return static::active()
            ->whereRaw('LOWER(area_name) = ?', [strtolower($name)])
            ->first();
    }

    /**
     * Get the BSS area ID for a given area name.
     */
    public static function getAreaIdByName(string $name): ?string
    {
        $region = static::findByName($name);
        return $region?->area_id;
    }
}
