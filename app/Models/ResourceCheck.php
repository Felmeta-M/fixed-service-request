<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceCheck extends Model
{
    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'prod_spec_code',
        'number_line',
        'event_code',
        'cust_id',
        'cust_name',
        'longitude',
        'latitude',
        'staff_code',
        'staff_name',
        'combo_flag',
        'timestamp',
        'cust_addr',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [];
}
