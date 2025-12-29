<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'name',
        'brand',
        'model',
        'serial',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function surveyRequest()
    {
        return $this->belongsTo(SurveyOrder::class);
    }
}
