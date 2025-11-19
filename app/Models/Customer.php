<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use Notifiable, HasFactory, HasApiTokens, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'address' => 'array',
        'contact' => 'array',
        'contact_persons' => 'array',
        'birthdate' => 'date',
    ];
}
