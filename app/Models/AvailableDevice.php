<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AvailableDevice extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $table = 'available_devices';

    protected $fillable = [
        'name',
        'vendor',
        'model',
        'price',
        'description',
        'status',
        'image_url',
        'stock_quantity',
        'specifications',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'specifications' => 'array',
    ];

    /**
     * Get only active devices
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
