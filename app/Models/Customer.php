<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
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
