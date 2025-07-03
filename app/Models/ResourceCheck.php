<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceCheck extends Model
{
    protected $fillable = [
        'prod_spec_code',
        'number_line',
        'event_code',
        'cust_id',
        'cust_name',
        'longitude',
        'latitude',
        'staff_code',
        'staff_name',
        'combo_flag',
        'timestamp',
        'cust_addr',
    ];

    protected $casts = [];
}
