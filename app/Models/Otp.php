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

    protected $fillable = ['name', 'phone_number', 'customer_sub_id', 'customer_code', 'code', 'expiry_date', 'api_token'];


    protected $dates = [
        'expires_at',
    ];
}
