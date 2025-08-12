<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class ServiceClient extends Authenticatable
{
    protected $fillable = [
        'name',
        'phone',
        'otp_code',
        'otp_expires_at',
    ];

    protected $hidden = [
        'otp_code',
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
    ];
}
