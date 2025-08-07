<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Model
{
    use HasApiTokens;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'code',
        'first_name',
        'middle_name',
        'last_name',
        'title',
        'gender',
        'nationality',
        'identification_type',
        'identification_number',
        'date_of_birth',
        'place_of_birth',
        'occupation',
        'education',
        'religion',
        'income',
        'primary_language',
        'address',
        'contact',
        'contact_persons',
    ];

    protected $casts = [
        'address' => 'array',
        'contact' => 'array',
        'contact_persons' => 'array',
        'date_of_birth' => 'date',
    ];
}
