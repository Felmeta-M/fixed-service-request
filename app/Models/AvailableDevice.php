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

    /**
     * The attributes that are mass assignable.
     * Only allow specific fields to prevent mass assignment attacks.
     */
    protected $fillable = [
        'name',
        'vendor',
        'model',
        'device_type',
        'media_type',
        'item_code',
        'offer_id',
        'item_name',
        'item_type',
        'discount_fee',
        'price',
        'description',
        'status',
        'image_url',
        'stock_quantity',
        'specifications',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_fee' => 'decimal:4',
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

    /**
     * Scope to filter by device type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where(function ($q) use ($type) {
            $q->where('device_type', $type)
                ->orWhere('device_type', 'universal');
        });
    }

    /**
     * Scope to filter by media type (PON/COPPER)
     * Includes UNIVERSAL devices that work with any media type
     */
    public function scopeByMediaType($query, string $mediaType)
    {
        $mediaType = strtoupper($mediaType);

        return $query->where(function ($q) use ($mediaType) {
            $q->where('media_type', $mediaType)
                ->orWhere('media_type', 'UNIVERSAL');
        });
    }
}
