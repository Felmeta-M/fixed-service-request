<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class Otp extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'otps';

    protected $fillable = [
        'phone',
        'code',
        // 'user_id',
        'expires_at'
    ];

    protected $dates = [
        'expires_at'
    ];

    public $timestamps = true;
}