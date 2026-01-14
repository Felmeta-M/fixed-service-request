<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrimaryOffering extends Model
{
    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'offering_id',
        'offering_name',
        'offering_short_name',
        'network_type',
        'effective_date',
        'expire_date',
        'monthly_cost',
        'one_time_cost',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];
}
