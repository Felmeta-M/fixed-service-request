<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Otp extends Authenticatable
{
    use HasFactory, Notifiable;

    public $timestamps = true;

    protected $table = 'otps';

    protected $fillable = [
        'customer_code',
        'phone',
        'code',
        'name',
        'expires_at',
    ];

    protected $dates = [
        'expires_at',
    ];
}
