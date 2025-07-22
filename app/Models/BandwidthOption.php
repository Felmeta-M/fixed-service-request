<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BandwidthOption extends Model
{
    protected $fillable = ['residential_options', 'enterprise_options'];

    protected $casts = [
        'residential_options' => 'array',
        'enterprise_options' => 'array',
    ];
}
