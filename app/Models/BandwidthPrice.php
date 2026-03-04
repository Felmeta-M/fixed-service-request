<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BandwidthPrice extends Model
{
    protected $fillable = [
        'bandwidth_value',
        'price',
        'currency',
    ];

    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];
}
