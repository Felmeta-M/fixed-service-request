<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrimaryOffering extends Model
{
    protected $fillable = [
        'offering_id',
        'offering_name',
        'offering_short_name',
        'network_type',
        'effective_date',
        'expire_date',
        'monthly_cost',
        'one_time_cost',
    ];
}
