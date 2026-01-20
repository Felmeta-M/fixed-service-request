<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncomeLevel extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'code',
        'label',
        'status',
        'sort_order',
    ];

    /**
     * Attributes that should never be mass assigned.
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'status' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Scope a query to only include active income levels.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope a query to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
