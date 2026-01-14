<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BandwidthOption extends Model
{
    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'residential_options',
        'enterprise_options',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'residential_options' => 'array',
        'enterprise_options' => 'array',
    ];
}
