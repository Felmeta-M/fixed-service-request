<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class ServiceClient extends Authenticatable
{
    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'phone',
        'otp_code',
        'otp_expires_at',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $hidden = [
        'otp_code',
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
    ];
}
