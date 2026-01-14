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

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'name',
        'phone_number',
        'customer_sub_id',
        'customer_code',
        'code',
        'expires_at',
        'api_token',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $dates = [
        'expires_at',
    ];
}
