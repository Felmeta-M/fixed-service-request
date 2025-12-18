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

    protected $appends = ['address_string'];

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
            'title',
            'name',
            'phone_number',
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
            'region',
            'city',
            'wereda',
            'zone',
            'kebele',
            'house_no'
        ])
            ->where('sub', Auth::guard('api')->user()?->customer_sub_id)
            ->first();
    }

    public function getAddressStringAttribute(): string
    {
        $rawAddress = $this->addres;

        if (is_array($rawAddress)) {
            return collect($rawAddress)
                ->filter()
                ->map(fn($value, $key) => ucfirst($key) . ': ' . trim($value))
                ->implode(', ');
        }

        return (string) $rawAddress;
    }
}
