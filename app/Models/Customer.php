<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
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

    public static function current()
    {
        return self::select([
            'sub',
            'code',
            'name',
            'phone',
            'title',
            'gender',
            'nationality',
            'identification_type',
            'identification_number',
            'birthdate',
            'place_of_birth',
            'occupation',
            'education',
            'religion',
            'income',
            'primary_language',
            'picture',
            'address',
            'contact',
            'contact_persons',
        ])
            ->where('sub', Auth::guard('api')->user()->customer_sub_id)
            ->first();
    }
}
