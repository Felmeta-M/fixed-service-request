<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TroubleTicketReason extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'network_type',
        'network_name',
        'reason_path',
        'reason',
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
        'network_type' => 'integer',
        'status' => 'boolean',
    ];

    /**
     * Scope a query to only include active reasons.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope a query to filter by network type.
     */
    public function scopeByNetworkType($query, int $networkType)
    {
        return $query->where('network_type', $networkType);
    }

    /**
     * Scope a query to filter by network name.
     */
    public function scopeByNetworkName($query, string $networkName)
    {
        return $query->where('network_name', $networkName);
    }

    /**
     * Scope a query to filter by reason path.
     */
    public function scopeByReasonPath($query, string $reasonPath)
    {
        return $query->where('reason_path', $reasonPath);
    }
}
